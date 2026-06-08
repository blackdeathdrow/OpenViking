#!/usr/bin/env python3
"""Tau2 batch train/eval orchestration on the OpenViking train pipeline."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from benchmark.tau2.train.case_loader import Tau2CaseLoader
from benchmark.tau2.train.rollout_evaluator import Tau2RewardRolloutEvaluator
from benchmark.tau2.train.rollout_executor import Tau2RolloutExecutor
from openviking.server.config import load_server_config
from openviking.server.identity import RequestContext, Role
from openviking.service.core import OpenVikingService
from openviking.session.train import (
    ContentHashPolicySnapshotter,
    ExperienceGradientContext,
    ExperienceGradientEstimator,
    ExperienceSet,
    ExperienceSetLoader,
    MemoryFilePolicyUpdater,
    OfflinePolicyOptimizationPipeline,
    PatchMergePolicyOptimizer,
    PatchMergePolicyOptimizerContext,
    PipelineContext,
    PipelineEvaluationResult,
    PipelineResult,
    TrajectoryAnalyzerContext,
    TrajectoryRolloutAnalyzer,
)
from openviking.telemetry import start_current_span, tracer
from openviking.telemetry.tracer import init_tracer_from_server_config
from openviking_cli.utils.config.open_viking_config import OpenVikingConfigSingleton


@dataclass(slots=True)
class Tau2BatchRunConfig:
    """Configuration for one tau2 batch train/eval run."""

    domain: str
    epochs: int = 1
    batch_size: int | None = None
    concurrency: int = 20
    config_path: str | None = None
    output_path: str | None = None
    data_root: str | None = None
    keep_default_tools: bool = True
    max_iterations: int = 30

    def __post_init__(self) -> None:
        if not self.domain:
            raise ValueError("domain is required")
        if self.epochs < 0:
            raise ValueError("epochs must be >= 0")
        if self.batch_size is not None and self.batch_size <= 0:
            raise ValueError("batch_size must be > 0")
        if self.concurrency <= 0:
            raise ValueError("concurrency must be > 0")
        if self.max_iterations <= 0:
            raise ValueError("max_iterations must be > 0")


@dataclass(slots=True)
class Tau2BatchRunReport:
    """Serializable report for tau2 batch train/eval."""

    domain: str
    epochs: int
    batch_size: int | None
    concurrency: int
    policy_root_uri: str
    baseline_eval: dict[str, Any] | None
    train_epochs: list[dict[str, Any]] = field(default_factory=list)
    final_eval: dict[str, Any] | None = None
    score_delta: float | None = None
    output_path: str | None = None
    trace_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "domain": self.domain,
            "epochs": self.epochs,
            "batch_size": self.batch_size,
            "concurrency": self.concurrency,
            "policy_root_uri": self.policy_root_uri,
            "baseline_eval": self.baseline_eval,
            "train_epochs": self.train_epochs,
            "final_eval": self.final_eval,
            "score_delta": self.score_delta,
            "output_path": self.output_path,
            "trace_id": self.trace_id,
        }


@tracer("tau2.batch_train_eval.run", ignore_result=True, ignore_args=True)
async def run_tau2_batch_train_eval(config: Tau2BatchRunConfig) -> Tau2BatchRunReport:
    """Run baseline eval, train epochs, and final eval for one tau2 domain."""

    _configure_openviking_config(config.config_path)
    init_tracer_from_server_config(load_server_config())

    service = OpenVikingService()
    await service.initialize()
    try:
        if service.viking_fs is None:
            raise RuntimeError("OpenVikingService.viking_fs is not initialized")
        if service.vikingdb_manager is None:
            raise RuntimeError("OpenVikingService.vikingdb_manager is not initialized")

        request_context = RequestContext(user=service.user, role=Role.ROOT)
        policy_root_uri = f"viking://user/{request_context.user.user_id}/memories/experiences"
        policy_set = await ExperienceSetLoader(viking_fs=service.viking_fs).load(
            policy_root_uri,
            ctx=request_context,
        )
        pipeline = _build_pipeline(config, service)
        baseline_eval: dict[str, Any] | None = None
        final_eval: dict[str, Any] | None = None
        train_epoch_reports: list[dict[str, Any]] = []

        test_loader = Tau2CaseLoader(
            domain=config.domain,
            split="test",
            batch_size=config.batch_size,
            data_root=config.data_root,
        )
        if test_loader.split_exists():
            baseline_result = await _eval(
                pipeline=pipeline,
                loader=test_loader,
                policy_set=policy_set,
                request_context=request_context,
                epoch=-1,
            )
            baseline_eval = _evaluation_report(baseline_result)
            _print_eval_summary("baseline_eval", baseline_eval)

        for epoch in range(config.epochs):
            train_loader = Tau2CaseLoader(
                domain=config.domain,
                split="train",
                batch_size=config.batch_size,
                data_root=config.data_root,
            )
            result = await _train_one_epoch(
                pipeline=pipeline,
                loader=train_loader,
                policy_set=policy_set,
                request_context=request_context,
                epoch=epoch,
            )
            policy_set = result.apply_result.updated_policy_set
            epoch_report = _train_result_report(result, epoch=epoch)
            train_epoch_reports.append(epoch_report)
            _print_train_summary(epoch_report)

        if test_loader.split_exists():
            final_result = await _eval(
                pipeline=pipeline,
                loader=test_loader,
                policy_set=policy_set,
                request_context=request_context,
                epoch=config.epochs,
            )
            final_eval = _evaluation_report(final_result)
            _print_eval_summary("final_eval", final_eval)

        score_delta = _score_delta(baseline_eval, final_eval)
        report = Tau2BatchRunReport(
            domain=config.domain,
            epochs=config.epochs,
            batch_size=config.batch_size,
            concurrency=config.concurrency,
            policy_root_uri=policy_root_uri,
            baseline_eval=baseline_eval,
            train_epochs=train_epoch_reports,
            final_eval=final_eval,
            score_delta=score_delta,
            output_path=_default_output_path(config),
            trace_id=tracer.get_trace_id() or None,
        )
        _write_report(report, config)
        _print_report_summary(report)
        return report
    finally:
        await service.close()


def _configure_openviking_config(config_path: str | None) -> None:
    if config_path:
        os.environ["OPENVIKING_CONFIG_FILE"] = str(Path(config_path).expanduser())
    OpenVikingConfigSingleton.reset_instance()


def _build_pipeline(
    config: Tau2BatchRunConfig,
    service: OpenVikingService,
) -> OfflinePolicyOptimizationPipeline:
    return OfflinePolicyOptimizationPipeline(
        snapshotter=ContentHashPolicySnapshotter(prefix="tau2-policy-snapshot"),
        rollout_executor=Tau2RolloutExecutor(
            config_path=config.config_path,
            concurrency=config.concurrency,
            keep_default_tools=config.keep_default_tools,
            max_iterations=config.max_iterations,
        ),
        rollout_analyzer=TrajectoryRolloutAnalyzer(
            viking_fs=service.viking_fs,
            vikingdb=service.vikingdb_manager,
            evaluator=Tau2RewardRolloutEvaluator(),
        ),
        gradient_estimator=ExperienceGradientEstimator(viking_fs=service.viking_fs),
        policy_optimizer=PatchMergePolicyOptimizer(
            viking_fs=service.viking_fs,
            memory_type="experiences",
        ),
        policy_updater=MemoryFilePolicyUpdater(viking_fs=service.viking_fs),
    )


async def _eval(
    *,
    pipeline: OfflinePolicyOptimizationPipeline,
    loader: Tau2CaseLoader,
    policy_set: ExperienceSet,
    request_context: RequestContext,
    epoch: int,
) -> PipelineEvaluationResult:
    with start_current_span(f"tau2.eval.{loader.split}.epoch_{epoch}"):
        return await pipeline.eval(
            case_loader=loader,
            policy_set=policy_set,
            context=_pipeline_context(request_context, epoch=epoch),
        )


async def _train_one_epoch(
    *,
    pipeline: OfflinePolicyOptimizationPipeline,
    loader: Tau2CaseLoader,
    policy_set: ExperienceSet,
    request_context: RequestContext,
    epoch: int,
) -> PipelineResult:
    with start_current_span(f"tau2.train.epoch_{epoch}"):
        return await pipeline.train(
            case_loader=loader,
            policy_set=policy_set,
            context=_pipeline_context(request_context, epoch=epoch),
        )


def _pipeline_context(request_context: RequestContext, *, epoch: int) -> PipelineContext:
    return PipelineContext(
        analysis_context=TrajectoryAnalyzerContext(
            request_context=request_context,
            evaluator_context={"epoch": epoch},
        ),
        gradient_context=ExperienceGradientContext(
            request_context=request_context,
            messages=[],
        ),
        optimization_context=PatchMergePolicyOptimizerContext(request_context=request_context),
        apply_context=request_context,
        execution_metadata={"epoch": epoch},
        max_epochs=1,
    )


def _evaluation_report(result: PipelineEvaluationResult) -> dict[str, Any]:
    rewards = [float(analysis.evaluation.score) for analysis in result.analyses]
    return {
        "epoch": result.epoch,
        "case_count": len(result.analyses),
        "average_reward": _average(rewards),
        "passed_count": sum(1 for analysis in result.analyses if analysis.evaluation.passed),
        "rewards": rewards,
        "snapshot_ids": list(result.policy_snapshot_ids),
        "metadata": dict(result.metadata),
    }


def _train_result_report(result: PipelineResult, *, epoch: int) -> dict[str, Any]:
    rewards = [float(analysis.evaluation.score) for analysis in result.analyses]
    written_uris = [uri for item in result.epochs for uri in item.apply_result.written_uris]
    deleted_uris = [uri for item in result.epochs for uri in item.apply_result.deleted_uris]
    errors = [error for item in result.epochs for error in item.apply_result.errors]
    snapshot_ids = [sid for item in result.epochs for sid in item.policy_snapshot_ids]
    return {
        "epoch": epoch,
        "case_count": len(result.analyses),
        "average_reward": _average(rewards),
        "passed_count": sum(1 for analysis in result.analyses if analysis.evaluation.passed),
        "batch_count": len(snapshot_ids),
        "gradient_count": len(result.gradients),
        "plan_item_count": len(result.plan.items),
        "written_uris": written_uris,
        "deleted_uris": deleted_uris,
        "errors": errors,
        "snapshot_ids": snapshot_ids,
        "metadata": dict(result.metadata),
    }


def _score_delta(
    baseline_eval: dict[str, Any] | None,
    final_eval: dict[str, Any] | None,
) -> float | None:
    if not baseline_eval or not final_eval:
        return None
    baseline = baseline_eval.get("average_reward")
    final = final_eval.get("average_reward")
    if baseline is None or final is None:
        return None
    return float(final) - float(baseline)


def _average(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def _write_report(report: Tau2BatchRunReport, config: Tau2BatchRunConfig) -> None:
    output_path = Path(_default_output_path(config)).expanduser()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(report.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    report.output_path = str(output_path)


def _default_output_path(config: Tau2BatchRunConfig) -> str:
    if config.output_path:
        return str(Path(config.output_path).expanduser())
    return str(
        Path(__file__).resolve().parent
        / "result"
        / f"{config.domain}_batch_train_eval.json"
    )


def _print_eval_summary(label: str, data: dict[str, Any]) -> None:
    print(
        f"[{label}] epoch={data['epoch']} cases={data['case_count']} "
        f"avg_reward={_fmt_score(data['average_reward'])} passed={data['passed_count']}"
    )


def _print_train_summary(data: dict[str, Any]) -> None:
    print(
        f"[train_epoch] epoch={data['epoch']} cases={data['case_count']} "
        f"avg_reward={_fmt_score(data['average_reward'])} gradients={data['gradient_count']} "
        f"writes={len(data['written_uris'])} deletes={len(data['deleted_uris'])} "
        f"errors={len(data['errors'])}"
    )


def _print_report_summary(report: Tau2BatchRunReport) -> None:
    print("==== Tau2 Batch Train/Eval Report ====")
    print(f"domain: {report.domain}")
    print(f"epochs: {report.epochs}")
    print(f"policy_root_uri: {report.policy_root_uri}")
    if report.baseline_eval:
        print(f"baseline average reward: {_fmt_score(report.baseline_eval['average_reward'])}")
    if report.final_eval:
        print(f"final average reward: {_fmt_score(report.final_eval['average_reward'])}")
    if report.score_delta is not None:
        print(f"score delta: {_fmt_score(report.score_delta)}")
    if report.trace_id:
        print(f"trace_id: {report.trace_id}")
    print(f"report: {report.output_path}")


def _fmt_score(value: Any) -> str:
    if value is None:
        return "n/a"
    return f"{float(value):.6f}"

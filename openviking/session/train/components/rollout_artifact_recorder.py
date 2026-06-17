# Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
# SPDX-License-Identifier: AGPL-3.0
"""Rollout artifact recording for batch train/eval pipelines."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from openviking.message import ToolPart
from openviking.session.train.components.dataset_service import evaluation_to_dict, jsonable
from openviking.session.train.components.reporter import NoopPipelineLifecycleHook
from openviking.session.train.domain import (
    PipelineEpochResult,
    PipelineEvaluationResult,
    Rollout,
    RolloutAnalysis,
)


@dataclass(slots=True)
class RolloutArtifactIndex:
    """Serializable index of recorded rollout artifacts."""

    run_dir: str
    rollouts_root: str
    case_groups: list[dict[str, Any]] = field(default_factory=list)
    latest_failed_rollout: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "run_dir": self.run_dir,
            "rollouts_root": self.rollouts_root,
            "latest_failed_rollout": self.latest_failed_rollout,
            "case_groups": self.case_groups,
        }


class RolloutArtifactRecorder(NoopPipelineLifecycleHook):
    """Write per-case/per-rollout artifacts for all case groups.

    Each case group and all its rollouts are written to disk so success/failure
    trials can be compared by an LLM or inspected manually.

    Inherits from NoopPipelineLifecycleHook so it can be registered as a
    pipeline lifecycle hook; only on_epoch_end and on_eval_end are overridden.
    """

    def __init__(
        self,
        *,
        run_dir: Path,
        client: Any | None = None,
        latest_pointer_path: Path | None = None,
    ) -> None:
        self.run_dir = run_dir.expanduser().resolve()
        self.rollouts_root = self.run_dir / "rollouts"
        self.client = client
        self.latest_pointer_path = (
            latest_pointer_path.expanduser().resolve() if latest_pointer_path else None
        )
        self._case_groups: dict[str, dict[str, Any]] = {}
        self._latest_failed_rollout: Path | None = None

    def record_eval(
        self,
        *,
        label: str,
        epoch: int,
        analyses: list[RolloutAnalysis],
    ) -> None:
        grouped = self._group_records(
            [
                _RolloutRecord(
                    rollout=rollout,
                    evaluation=analysis.evaluation,
                    stage=_stage_dir(label),
                    epoch=epoch,
                )
                for analysis in analyses
                if isinstance((rollout := analysis.metadata.get("rollout")), Rollout)
            ]
        )
        for group_id, records in grouped.items():
            self._write_group(group_id, records)

    async def record_train_epoch(
        self,
        *,
        epoch: int,
        analyses: list[RolloutAnalysis],
        commit_results: list[dict[str, Any]],
    ) -> None:
        commit_by_index = {
            int(item["index"]): item
            for item in commit_results
            if isinstance(item, dict) and item.get("index") is not None
        }
        records: list[_RolloutRecord] = []
        for idx, analysis in enumerate(analyses):
            rollout = analysis.metadata.get("rollout")
            if not isinstance(rollout, Rollout):
                continue
            commit_result = commit_by_index.get(idx)
            records.append(
                _RolloutRecord(
                    rollout=rollout,
                    evaluation=analysis.evaluation,
                    stage=f"epoch_{epoch}",
                    epoch=epoch,
                    commit_result=commit_result,
                    commit_index=idx,
                )
            )
        grouped = self._group_records(records)
        for group_id, group_records in grouped.items():
            self._write_group(group_id, group_records)
            await self._write_train_commit_artifacts(group_records)

    async def on_epoch_end(
        self,
        *,
        epoch_result: PipelineEpochResult,
        policy_set: Any,
        context: Any,
    ) -> None:
        """Lifecycle hook: write rollout artifacts immediately after each training epoch.

        This ensures rollouts are persisted incrementally instead of waiting
        for the full pipeline to finish, which is important for long runs and
        crash recovery.
        """
        commit_results = list(
            epoch_result.apply_result.metadata.get("commit_results", []) or []
        )
        await self.record_train_epoch(
            epoch=epoch_result.epoch,
            analyses=epoch_result.analyses,
            commit_results=commit_results,
        )
        # Also update the index file incrementally so it stays current.
        self._write_index()

    def on_eval_end(
        self,
        *,
        evaluation_result: PipelineEvaluationResult,
        policy_set: Any,
        context: Any,
    ) -> None:
        """Lifecycle hook: write eval rollout artifacts immediately after each eval pass."""
        label = str(
            evaluation_result.metadata.get("rollout_stage") or "test_rollout"
        )
        self.record_eval(
            label=label,
            epoch=evaluation_result.epoch,
            analyses=evaluation_result.analyses,
        )
        self._write_index()

    def finalize(self) -> RolloutArtifactIndex:
        return self._write_index()

    def _write_index(self) -> RolloutArtifactIndex:
        """Write rollouts_index.json with current state (incremental update)."""
        case_groups = sorted(self._case_groups.values(), key=lambda item: item["case_group_id"])
        index = RolloutArtifactIndex(
            run_dir=str(self.run_dir),
            rollouts_root=str(self.rollouts_root),
            case_groups=case_groups,
            latest_failed_rollout=str(self._latest_failed_rollout) if self._latest_failed_rollout else None,
        )
        self.run_dir.mkdir(parents=True, exist_ok=True)
        index_path = self.run_dir / "rollouts_index.json"
        index_path.write_text(
            json.dumps(index.to_dict(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        if case_groups:
            self.rollouts_root.mkdir(parents=True, exist_ok=True)
        if self.latest_pointer_path is not None:
            self.latest_pointer_path.parent.mkdir(parents=True, exist_ok=True)
            self.latest_pointer_path.write_text(str(self.rollouts_root) + "\n", encoding="utf-8")
        return index

    def _group_records(self, records: list["_RolloutRecord"]) -> dict[str, list["_RolloutRecord"]]:
        grouped: dict[str, list[_RolloutRecord]] = {}
        for record in records:
            grouped.setdefault(_case_group_id(record.rollout), []).append(record)
        return grouped

    def _write_group(self, group_id: str, records: list["_RolloutRecord"]) -> None:
        if not records:
            return
        group_dir = self.rollouts_root / group_id
        group_dir.mkdir(parents=True, exist_ok=True)
        case = records[0].rollout.case
        _write_json(group_dir / "case.json", _case_to_dict(case))

        group_entry = self._case_groups.setdefault(
            group_id,
            {
                "case_group_id": group_id,
                "path": str(group_dir),
                "case_name": _original_case_name(records[0].rollout),
                "task_id": _task_id(records[0].rollout),
                "task_no": _task_no(records[0].rollout),
                "split": _split(records[0].rollout),
                "rollouts": [],
            },
        )

        seen_paths = {item["path"] for item in group_entry["rollouts"]}
        for record in records:
            rollout_dir = group_dir / record.stage / _rollout_dir_name(record)
            rollout_dir.mkdir(parents=True, exist_ok=True)
            self._write_rollout_artifacts(rollout_dir, record)
            rollout_index = _rollout_index(record, rollout_dir)
            if rollout_index["path"] not in seen_paths:
                group_entry["rollouts"].append(rollout_index)
                seen_paths.add(rollout_index["path"])
            if not record.passed or _commit_failed(record.commit_result):
                self._latest_failed_rollout = rollout_dir
        self._write_group_readme(group_dir, group_entry)

    def _write_rollout_artifacts(self, rollout_dir: Path, record: "_RolloutRecord") -> None:
        rollout = record.rollout
        _write_json(rollout_dir / "status.json", _status_payload(record))
        _write_json(rollout_dir / "rollout.json", _rollout_payload(record))
        _write_json(rollout_dir / "messages.json", [message.to_dict() for message in rollout.messages])
        _write_json(rollout_dir / "tool_calls.json", _tool_calls(rollout))
        _write_json(rollout_dir / "evaluation.json", evaluation_to_dict(record.evaluation))
        (rollout_dir / "memory_context.md").write_text(_memory_context(rollout), encoding="utf-8")
        (rollout_dir / "prompt_for_llm.md").write_text(_prompt_for_llm(record), encoding="utf-8")
        if record.commit_result is not None:
            _write_json(rollout_dir / "commit_result.json", record.commit_result)

    async def _write_train_commit_artifacts(self, records: list["_RolloutRecord"]) -> None:
        if self.client is None:
            return
        for record in records:
            if record.commit_result is None:
                continue
            archive_uri = str(record.commit_result.get("archive_uri") or "").strip()
            if not archive_uri:
                continue
            rollout_dir = (
                self.rollouts_root
                / _case_group_id(record.rollout)
                / record.stage
                / _rollout_dir_name(record)
            )
            try:
                memory_diff = await self.client.read(f"{archive_uri}/memory_diff.json")
            except Exception as exc:  # best-effort artifact enrichment
                _write_json(
                    rollout_dir / "memory_diff_error.json",
                    {"archive_uri": archive_uri, "error": str(exc)},
                )
                continue
            (rollout_dir / "memory_diff.json").write_text(str(memory_diff), encoding="utf-8")

    def _write_group_readme(self, group_dir: Path, group_entry: dict[str, Any]) -> None:
        failed = [item for item in group_entry["rollouts"] if not item.get("passed") or item.get("commit_error")]
        lines = [
            f"# Rollout artifact group: {group_entry['case_group_id']}",
            "",
            f"- split: {group_entry.get('split')}",
            f"- task_no: {group_entry.get('task_no')}",
            f"- task_id: {group_entry.get('task_id')}",
            f"- rollouts: {len(group_entry['rollouts'])}",
            f"- failed_rollouts: {len(failed)}",
            "",
            "## Rollouts",
        ]
        for item in group_entry["rollouts"]:
            status = "FAIL" if (not item.get("passed") or item.get("commit_error")) else "PASS"
            lines.append(
                f"- [{status}] {item.get('stage')} {item.get('rollout_name')} "
                f"score={item.get('score')} path={item.get('path')}"
            )
        lines.extend(
            [
                "",
                "## Suggested LLM prompt",
                "",
                "Read this directory recursively. Compare successful and failed rollouts for the same task. ",
                "Focus on whether the injected memory_context.md was missing, misleading, ignored, or helpful.",
            ]
        )
        (group_dir / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


@dataclass(slots=True)
class _RolloutRecord:
    rollout: Rollout
    evaluation: Any
    stage: str
    epoch: int
    commit_result: dict[str, Any] | None = None
    commit_index: int | None = None

    @property
    def passed(self) -> bool:
        return bool(getattr(self.evaluation, "passed", False))

    @property
    def score(self) -> float:
        return float(getattr(self.evaluation, "score", 0.0) or 0.0)


def _write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(jsonable(value), ensure_ascii=False, indent=2), encoding="utf-8")


def _case_to_dict(case: Any) -> dict[str, Any]:
    return {
        "name": case.name,
        "task_signature": case.task_signature,
        "input": jsonable(case.input),
        "rubric": {
            "name": case.rubric.name,
            "description": case.rubric.description,
            "criteria": [
                {
                    "name": criterion.name,
                    "description": criterion.description,
                    "required": criterion.required,
                    "weight": criterion.weight,
                    "metadata": criterion.metadata,
                }
                for criterion in case.rubric.criteria
            ],
            "metadata": case.rubric.metadata,
        },
        "metadata": jsonable(case.metadata),
    }


def _status_payload(record: _RolloutRecord) -> dict[str, Any]:
    rollout = record.rollout
    return {
        "stage": record.stage,
        "epoch": record.epoch,
        "rollout_name": _rollout_name(record),
        "case_group_id": _case_group_id(rollout),
        "case_name": rollout.case.name,
        "original_case_name": _original_case_name(rollout),
        "split": _split(rollout),
        "task_no": _task_no(rollout),
        "task_id": _task_id(rollout),
        "trial": _trial(rollout),
        "passed": record.passed,
        "score": record.score,
        "policy_snapshot_id": rollout.policy_snapshot_id,
        "has_memory_context": bool(_memory_context(rollout).strip()),
        "commit_error": record.commit_result.get("error") if record.commit_result else None,
    }


def _rollout_payload(record: _RolloutRecord) -> dict[str, Any]:
    rollout = record.rollout
    return {
        "case": _case_to_dict(rollout.case),
        "policy_snapshot_id": rollout.policy_snapshot_id,
        "metadata": jsonable(rollout.metadata),
        "evaluation": evaluation_to_dict(record.evaluation),
    }


def _rollout_index(record: _RolloutRecord, rollout_dir: Path) -> dict[str, Any]:
    return {
        "rollout_name": _rollout_name(record),
        "stage": record.stage,
        "epoch": record.epoch,
        "trial": _trial(record.rollout),
        "passed": record.passed,
        "score": record.score,
        "path": str(rollout_dir),
        "commit_error": record.commit_result.get("error") if record.commit_result else None,
        "archive_uri": record.commit_result.get("archive_uri") if record.commit_result else None,
    }


def _tool_calls(rollout: Rollout) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []
    for message_index, message in enumerate(rollout.messages):
        for part in message.parts:
            if isinstance(part, ToolPart):
                calls.append(
                    {
                        "message_index": message_index,
                        "message_id": message.id,
                        "role": message.role,
                        "tool_id": part.tool_id,
                        "tool_name": part.tool_name,
                        "tool_status": part.tool_status,
                        "tool_input": jsonable(part.tool_input),
                        "tool_output": part.tool_output,
                    }
                )
    return calls


def _prompt_for_llm(record: _RolloutRecord) -> str:
    status = _status_payload(record)
    return "\n".join(
        [
            "# Analyze this rollout",
            "",
            "Read all files in this directory, especially:",
            "- memory_context.md: memory injected into the agent prompt at rollout time",
            "- messages.json and tool_calls.json: trajectory",
            "- evaluation.json: failure signal",
            "- memory_diff.json: training memory update result when present",
            "",
            "## Status",
            "",
            "```json",
            json.dumps(jsonable(status), ensure_ascii=False, indent=2),
            "```",
            "",
            "Please identify whether the failure is caused by missing memory, "
            "wrong memory, ignored memory, bad tool use, or task ambiguity.",
        ]
    ) + "\n"


def _memory_context(rollout: Rollout) -> str:
    metadata = rollout.metadata or {}
    value = metadata.get("memory")
    if value is None:
        return ""
    return str(value)


def _case_group_id(rollout: Rollout) -> str:
    split = _safe_fragment(_split(rollout) or "split")
    task_no = _safe_fragment(
        str(_task_no(rollout) if _task_no(rollout) is not None else "x")
    )
    task_id = _safe_fragment(
        str(_task_id(rollout) or _original_case_name(rollout) or rollout.case.name)
    )
    return f"{split}_task_{task_no}_{task_id}"[:120]


def _rollout_dir_name(record: _RolloutRecord) -> str:
    return _safe_fragment(_rollout_name(record))


def _rollout_name(record: _RolloutRecord) -> str:
    trial = _trial(record.rollout)
    if trial is not None:
        return f"trial_{trial}"
    if record.commit_index is not None:
        return f"rollout_{record.commit_index}"
    return _safe_fragment(record.rollout.case.name)


def _stage_dir(label: str) -> str:
    if label == "baseline_test_rollout":
        return "baseline_test"
    if label == "final_test_rollout":
        return "final_test"
    if label == "test_rollout":
        return "test"
    return _safe_fragment(label)


def _original_case_name(rollout: Rollout) -> str:
    return str(
        rollout.case.input.get("original_case_name")
        or rollout.case.metadata.get("original_case_name")
        or rollout.metadata.get("original_case_name")
        or rollout.case.name
    )


def _split(rollout: Rollout) -> str | None:
    value = (
        rollout.case.input.get("data_split")
        or rollout.metadata.get("data_split")
        or rollout.case.input.get("split")
        or rollout.metadata.get("split")
    )
    return str(value) if value is not None else None


def _task_no(rollout: Rollout) -> Any:
    return rollout.case.input.get("task_no", rollout.metadata.get("task_no"))


def _task_id(rollout: Rollout) -> Any:
    return rollout.case.input.get("task_id", rollout.metadata.get("task_id"))


def _trial(rollout: Rollout) -> Any:
    if "eval_trial" in rollout.case.input:
        return rollout.case.input.get("eval_trial")
    if "eval_trial" in rollout.case.metadata:
        return rollout.case.metadata.get("eval_trial")
    return rollout.metadata.get("eval_trial")


def _commit_failed(commit_result: dict[str, Any] | None) -> bool:
    return bool(commit_result and commit_result.get("error"))


def _safe_fragment(value: Any) -> str:
    text = str(value)
    text = re.sub(r"[^A-Za-z0-9_.-]+", "_", text).strip("_")
    return text or "unknown"

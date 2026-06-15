# Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
# SPDX-License-Identifier: AGPL-3.0

from __future__ import annotations

from pathlib import Path

from openviking.session.train.batch_runner import (
    BatchTrainEvalConfig,
    _baseline_cache_key,
    _clean_result_dir,
    _load_baseline_cache,
    _write_baseline_cache,
)


def test_baseline_cache_key_depends_on_trials_and_eval_limit():
    base = BatchTrainEvalConfig(
        dataset="tau2",
        domain="airline",
        eval_limit=25,
        trials=8,
        benchmark_service_url="http://127.0.0.1:1944",
    )

    assert _baseline_cache_key(base) == _baseline_cache_key(
        BatchTrainEvalConfig(
            dataset="tau2",
            domain="airline",
            eval_limit=25,
            trials=8,
            benchmark_service_url="http://127.0.0.1:1944",
        )
    )
    assert _baseline_cache_key(base) != _baseline_cache_key(
        BatchTrainEvalConfig(
            dataset="tau2",
            domain="airline",
            eval_limit=25,
            trials=1,
            benchmark_service_url="http://127.0.0.1:1944",
        )
    )
    assert _baseline_cache_key(base) != _baseline_cache_key(
        BatchTrainEvalConfig(
            dataset="tau2",
            domain="airline",
            eval_limit=10,
            trials=8,
            benchmark_service_url="http://127.0.0.1:1944",
        )
    )


def test_baseline_cache_round_trips_report(tmp_path: Path):
    cache_path = tmp_path / "baseline.json"
    config = BatchTrainEvalConfig(
        dataset="tau2",
        domain="airline",
        eval_limit=1,
        trials=1,
        benchmark_service_url="http://127.0.0.1:1944",
    )
    report = {
        "epoch": -1,
        "rollout_stage": "baseline_test_rollout",
        "case_count": 1,
        "accuracy": 1.0,
        "passed_count": 1,
        "average_reward": 1.0,
    }

    _write_baseline_cache(cache_path, report, config=config)
    loaded = _load_baseline_cache(cache_path)

    assert loaded is not None
    assert loaded["baseline_cache_hit"] is True
    assert loaded["baseline_cache_path"] == str(cache_path)
    assert loaded["accuracy"] == 1.0


def test_clean_result_preserves_baseline_cache(tmp_path: Path, monkeypatch):
    import openviking.session.train.batch_runner as batch_runner

    monkeypatch.setattr(batch_runner, "_repo_root", lambda: tmp_path)
    result_dir = tmp_path / "result" / "tau2" / "train"
    cache_file = result_dir / "cache" / "baseline" / "baseline.json"
    stale_file = result_dir / "airline_old" / "report.json"
    cache_file.parent.mkdir(parents=True)
    stale_file.parent.mkdir(parents=True)
    cache_file.write_text("{}", encoding="utf-8")
    stale_file.write_text("{}", encoding="utf-8")

    _clean_result_dir(
        BatchTrainEvalConfig(
            dataset="tau2",
            domain="airline",
            benchmark_service_url="http://127.0.0.1:1944",
        )
    )

    assert cache_file.exists()
    assert not stale_file.exists()

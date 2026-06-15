#!/usr/bin/env python3
"""CLI for remote benchmark batch policy train/eval."""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run remote benchmark batch policy train/eval")
    parser.add_argument("--dataset", required=True, help="Remote benchmark dataset")
    parser.add_argument("--domain", required=True, help="Benchmark domain")
    parser.add_argument("--epochs", type=int, default=1, help="Training epochs (default: 1)")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Train/eval batch size. Default uses the whole split as one batch.",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=150,
        help="Concurrent rollout executions for train and eval (default: 150)",
    )
    parser.add_argument(
        "--commit-concurrency",
        type=int,
        default=100,
        help="Concurrent OpenViking session.commit submissions during train (default: 100)",
    )
    parser.add_argument("--config", default=None, help="ov.conf path (optional)")
    parser.add_argument("--server-url", default=None, help="OpenViking server URL. Defaults to ov.conf/ovcli.conf")
    parser.add_argument("--api-key", default=None, help="OpenViking API key. Defaults to ov.conf/ovcli.conf")
    parser.add_argument("--account-id", default="default", help="OpenViking trusted account id. Default: default")
    parser.add_argument("--user-id", default="default", help="OpenViking trusted user id. Default: default")
    parser.add_argument("--output", default=None, help="JSON report output path")
    parser.add_argument(
        "--events-output",
        default=None,
        help="Streaming JSONL event output path. Defaults to report directory/events.jsonl.",
    )
    parser.add_argument(
        "--benchmark-service-url",
        default=None,
        help="Benchmark runtime service URL, e.g. http://127.0.0.1:1944",
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=30,
        help="Max steps/iterations per rollout (default: 30)",
    )
    parser.add_argument(
        "--train-limit",
        type=int,
        default=None,
        help="Limit number of train cases for smoke tests.",
    )
    parser.add_argument(
        "--eval-limit",
        type=int,
        default=None,
        help="Limit number of eval cases for smoke tests.",
    )
    parser.add_argument(
        "--force-baseline-recompute",
        action="store_true",
        help=(
            "Recompute the cached pre-training test baseline instead of reusing an "
            "existing cache file."
        ),
    )
    parser.add_argument(
        "--eval-each-epoch",
        action="store_true",
        help="Run held-out eval after every training epoch. Disabled by default.",
    )
    parser.add_argument(
        "--trials",
        type=int,
        default=8,
        help="Run each eval split N times and aggregate (default: 8).",
    )
    clean_group = parser.add_mutually_exclusive_group()
    clean_group.add_argument(
        "--clean-result",
        dest="clean_result",
        action="store_true",
        default=True,
        help="Clean previous default result/{dataset}/train artifacts before running (default).",
    )
    clean_group.add_argument(
        "--no-clean-result",
        dest="clean_result",
        action="store_false",
        help="Keep previous result artifacts.",
    )
    return parser.parse_args()


async def main_async() -> int:
    args = parse_args()
    from openviking.session.train.batch_runner import (
        BatchTrainEvalConfig,
        run_batch_train_eval,
    )

    report = await run_batch_train_eval(
        BatchTrainEvalConfig(
            dataset=args.dataset,
            domain=args.domain,
            epochs=args.epochs,
            batch_size=args.batch_size,
            concurrency=args.concurrency,
            commit_concurrency=args.commit_concurrency,
            config_path=str(Path(args.config).expanduser()) if args.config else None,
            server_url=args.server_url,
            api_key=args.api_key,
            account_id=args.account_id,
            user_id=args.user_id,
            output_path=args.output,
            events_path=args.events_output,
            keep_default_tools=True,
            max_iterations=args.max_iterations,
            train_limit=args.train_limit,
            eval_limit=args.eval_limit,
            benchmark_service_url=args.benchmark_service_url,
            baseline_force_recompute=args.force_baseline_recompute,
            eval_each_epoch=args.eval_each_epoch,
            trials=args.trials,
            clean_result=args.clean_result,
        )
    )
    return 1 if any(epoch.get("errors") for epoch in report.train_epochs) else 0


def main() -> None:
    raise SystemExit(asyncio.run(main_async()))


if __name__ == "__main__":
    main()

# Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
# SPDX-License-Identifier: AGPL-3.0

"""Commit tests"""

import asyncio
from unittest.mock import MagicMock

import pytest

from openviking import AsyncOpenViking
from openviking.message import TextPart
from openviking.service.task_tracker import get_task_tracker
from openviking.session import Session
from openviking.storage.transaction import get_lock_manager
from openviking_cli.utils.config import get_openviking_config

pytestmark = [
    pytest.mark.asyncio(loop_scope="function"),
    pytest.mark.usefixtures("_drain_background_tasks"),
]


async def _wait_for_task(task_id: str, timeout: float = 30.0) -> dict:
    """Poll the task tracker until the task reaches a terminal state."""
    tracker = get_task_tracker()
    for _ in range(int(timeout / 0.1)):
        await _drain_archive_finalize_once()
        task = await tracker.get(task_id)
        if task and task.status.value in ("completed", "failed"):
            return task.to_dict()
        await asyncio.sleep(0.1)
    raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")


async def _drain_archive_finalize_once() -> bool:
    inst = AsyncOpenViking._instance
    if inst is None:
        return False
    service = inst._client.service.sessions
    store = service._archive_task_store
    if store is None:
        return False
    task = await store.claim_next_async("test-session-archive-finalizer")
    if task is None:
        return False
    await service._process_archive_finalize_task(store, task)
    return True


async def _wait_until(predicate, timeout: float = 5.0) -> None:
    for _ in range(int(timeout / 0.1)):
        if predicate():
            return
        await asyncio.sleep(0.1)
    raise TimeoutError("Condition did not become true within timeout")


class TestCommit:
    """Test commit"""

    async def test_commit_finalize_task_completes(self, session_with_messages: Session):
        """Test commit task tracks archive finalization."""
        result = await session_with_messages.commit_async()
        task_id = result["task_id"]

        assert result.get("status") == "accepted"
        assert "session_id" in result
        assert "memories_extracted" not in result

        task_result = await _wait_for_task(task_id)
        assert task_result["status"] == "completed"
        assert task_result["result"]["archive_uri"] == result["archive_uri"]

    async def test_commit_archives_messages(self, session_with_messages: Session):
        """Test commit archives messages"""
        initial_message_count = len(session_with_messages.messages)
        assert initial_message_count > 0

        result = await session_with_messages.commit_async()

        assert result.get("archived") is True
        # Current message list should be cleared after commit
        assert len(session_with_messages.messages) == 0

    async def test_commit_empty_session(self, session: Session):
        """Test committing empty session"""
        # Empty session commit should not raise error
        result = await session.commit_async()

        assert isinstance(result, dict)
        assert result.get("archived") is False

    async def test_commit_uses_latest_archive_overview_for_summary_and_extraction(
        self, client: AsyncOpenViking, monkeypatch: pytest.MonkeyPatch
    ):
        """Second finalize and memory side effects should receive latest completed overview."""
        session = client.session(session_id="latest_overview_threading_test")

        session.add_message("user", [TextPart("First round message")])
        session.add_message("assistant", [TextPart("First round response")])
        result1 = await session.commit_async()
        await _wait_for_task(result1["task_id"])

        previous_overview = await session._viking_fs.read_file(
            f"{result1['archive_uri']}/.overview.md",
            ctx=session.ctx,
        )
        seen: dict[str, str] = {}

        original_generate = Session._generate_archive_summary_async

        async def capture_generate(self, messages, latest_archive_overview=""):
            del self
            seen["summary"] = latest_archive_overview
            return await original_generate(
                session,
                messages,
                latest_archive_overview=latest_archive_overview,
            )

        async def capture_extract(*args, **kwargs):
            seen["extract"] = kwargs.get("latest_archive_overview", "")
            return []

        monkeypatch.setattr(Session, "_generate_archive_summary_async", capture_generate)
        monkeypatch.setattr(get_openviking_config().memory, "extraction_enabled", True)
        session._session_compressor.extract_long_term_memories = capture_extract

        session.add_message("user", [TextPart("Second round message")])
        session.add_message("assistant", [TextPart("Second round response")])
        result2 = await session.commit_async()
        task_result = await _wait_for_task(result2["task_id"])

        assert task_result["status"] == "completed"
        assert seen["summary"] == previous_overview
        await _wait_until(lambda: "extract" in seen)
        assert seen["extract"] == previous_overview

    async def test_active_count_incremented_after_commit(self, client: AsyncOpenViking):
        """Regression test: active_count must actually increment after commit.

        Archive finalization completes before best-effort memory side effects,
        so this assertion waits for the side effect to update storage.
        """
        uri = "viking://resources/active-count-regression.md"
        vikingdb = client._client.service.vikingdb_manager
        # Use the client's own context to match the account_id used when adding the resource
        client_ctx = client._client._ctx
        await vikingdb.upsert(
            {
                "id": "active-count-regression",
                "uri": uri,
                "type": "file",
                "context_type": "resource",
                "vector": [0.1] * 1024,
                "sparse_vector": {},
                "created_at": "2026-01-01T00:00:00+00:00",
                "updated_at": "2026-01-01T00:00:00+00:00",
                "active_count": 0,
                "level": 2,
                "name": "active-count-regression.md",
                "description": "",
                "tags": "",
                "abstract": "active count regression fixture",
                "account_id": client_ctx.account_id,
                "owner_user_id": client_ctx.user.user_id,
                "owner_agent_id": client_ctx.user.agent_id,
            },
            ctx=client_ctx,
        )

        # Look up the record by URI
        records_before = await vikingdb.get_context_by_uri(
            uri=uri,
            limit=1,
            ctx=client_ctx,
        )
        assert records_before, f"Resource not found for URI: {uri}"
        count_before = records_before[0].get("active_count") or 0

        # Mark as used and commit
        session = client.session(session_id="active_count_regression_test")
        session.add_message("user", [TextPart("Query")])
        session.used(contexts=[uri])
        session.add_message("assistant", [TextPart("Answer")])
        result = await session.commit_async()

        # Wait for background task to complete (active_count is updated there)
        task_result = await _wait_for_task(result["task_id"])
        assert task_result["status"] == "completed"

        # Verify the count actually changed in storage
        records_after = []
        for _ in range(50):
            records_after = await vikingdb.get_context_by_uri(
                uri=uri,
                limit=1,
                ctx=client_ctx,
            )
            if records_after and (records_after[0].get("active_count") or 0) == count_before + 1:
                break
            await asyncio.sleep(0.1)
        assert records_after, f"Record disappeared after commit for URI: {uri}"
        count_after = records_after[0].get("active_count") or 0
        assert count_after == count_before + 1, (
            f"active_count not incremented: before={count_before}, after={count_after}"
        )

    async def test_commit_skips_redo_when_recovery_disabled(
        self, session_with_messages: Session, monkeypatch: pytest.MonkeyPatch
    ):
        """Phase 2 should not write or clear redo markers when redo recovery is disabled."""

        redo_log = MagicMock()
        lock_manager = get_lock_manager()
        monkeypatch.setattr(lock_manager, "_redo_recovery_enabled", False)
        monkeypatch.setattr(lock_manager, "_redo_log", redo_log)

        result = await session_with_messages.commit_async()
        task_result = await _wait_for_task(result["task_id"])

        assert task_result["status"] == "completed"
        redo_log.write_pending.assert_not_called()
        redo_log.mark_done.assert_not_called()

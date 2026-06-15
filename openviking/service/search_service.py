# Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
# SPDX-License-Identifier: AGPL-3.0
"""Search Service for OpenViking.

Provides semantic search operations: search, find, and query-time resolution packs.
"""

import asyncio
import hashlib
import json
import time
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

from openviking.core.uri_validation import validate_optional_viking_uris
from openviking.prompts import render_prompt
from openviking.server.identity import RequestContext
from openviking.storage.viking_fs import VikingFS
from openviking_cli.exceptions import InvalidArgumentError, NotInitializedError
from openviking_cli.utils import get_logger

if TYPE_CHECKING:
    from openviking.session import Session

logger = get_logger(__name__)


DEFAULT_RESOLUTION_LIMITS = {
    "user_memory": 5,
    "experiences": 5,
    "tools_memory": 5,
    "skills": 5,
    "skills_memory": 5,
    "trajectory_grounding": 2,
    "pack_max_tokens": 6000,
    "pack_max_chars": 24000,
}


RESOLUTION_STEP_NAMES = {
    "step1_query_analysis": "Query analysis",
    "step2_initial_pseudo_plan": "Initial pseudo plan",
    "step3_retrieval_query_build": "Retrieval query build",
    "step4_parallel_candidate_retrieval": "Parallel candidate retrieval",
    "step5_materialize_candidates": "Materialize candidates",
    "step6_filter_dedupe_rank": "Filter, dedupe, and rank",
    "step7_conflict_and_trajectory_grounding": "Conflict resolution and trajectory grounding",
    "step8_final_context_merge": "Final context merge",
    "step9_revised_execution_outline": "Revised execution outline",
    "step10_pack_assembly": "Query Resolution Pack assembly",
}


def _compact_resolution_text(text: Any, limit: int = 2000) -> str:
    """Return a prompt-safe one-line-ish text snippet."""
    if isinstance(text, bytes):
        text = text.decode("utf-8", errors="replace")
    compact = " ".join(str(text or "").split())
    if len(compact) <= limit:
        return compact
    return compact[:limit].rstrip() + "..."


def _message_text_for_resolution(message: Dict[str, Any]) -> str:
    texts: List[str] = []
    for part in message.get("parts", []) or []:
        if not isinstance(part, dict):
            if part:
                texts.append(str(part))
            continue
        part_type = part.get("type")
        text = ""
        if part_type == "text":
            text = part.get("text", "")
        elif part_type == "context":
            text = part.get("abstract") or part.get("uri", "")
        elif part_type == "tool":
            pieces = [
                part.get("tool_name", ""),
                part.get("tool_status", ""),
                part.get("tool_output", ""),
            ]
            text = " ".join(str(piece) for piece in pieces if piece)
        else:
            text = part.get("text") or part.get("content") or part.get("abstract") or ""
        if text:
            texts.append(str(text))
    return _compact_resolution_text("\n".join(texts))


def session_payload_to_resolution_context(
    payload: Dict[str, Any],
    *,
    recent_messages: int = 8,
) -> List[Dict[str, Any]]:
    """Convert Session.get_session_context() output into search-resolution context items."""
    if not isinstance(payload, dict):
        return []
    context: List[Dict[str, Any]] = []
    overview = _compact_resolution_text(payload.get("latest_archive_overview", ""))
    if overview:
        context.append(
            {
                "role": "system",
                "content": overview,
                "source": "session_archive_overview",
            }
        )
    messages = payload.get("messages", [])
    if not isinstance(messages, list):
        messages = []
    for message in messages[-recent_messages:]:
        if not isinstance(message, dict):
            continue
        content = _message_text_for_resolution(message)
        if not content:
            continue
        context.append(
            {
                "role": message.get("role", "user"),
                "content": content,
                "source": "session_message",
                "message_id": message.get("id", ""),
            }
        )
    return context


def _ensure_non_empty_query(query: str) -> None:
    if not query.strip():
        raise InvalidArgumentError("Search query must not be empty.")


class SearchService:
    """Semantic search service."""

    def __init__(self, viking_fs: Optional[VikingFS] = None):
        self._viking_fs = viking_fs

    def set_viking_fs(self, viking_fs: VikingFS) -> None:
        """Set VikingFS instance (for deferred initialization)."""
        self._viking_fs = viking_fs

    def _ensure_initialized(self) -> VikingFS:
        """Ensure VikingFS is initialized."""
        if not self._viking_fs:
            raise NotInitializedError("VikingFS")
        return self._viking_fs

    async def search(
        self,
        query: str,
        ctx: RequestContext,
        target_uri: Union[str, List[str]] = "",
        session: Optional["Session"] = None,
        limit: int = 10,
        score_threshold: Optional[float] = None,
        filter: Optional[Dict] = None,
        level: Optional[List[int]] = None,
    ) -> Any:
        """Complex search with session context.

        Args:
            query: Query string
            target_uri: Target directory URI(s), supports str or List[str]
            session: Session object for context
            limit: Max results
            score_threshold: Score threshold
            filter: Metadata filters
            level: Filter by level (0=abstract, 1=overview, 2=file)

        Returns:
            FindResult
        """
        _ensure_non_empty_query(query)
        target_uri = validate_optional_viking_uris(target_uri, field_name="target_uri")
        viking_fs = self._ensure_initialized()

        session_info = None
        if session:
            session_info = await session.get_context_for_search(query)

        result = await viking_fs.search(
            query=query,
            ctx=ctx,
            target_uri=target_uri,
            session_info=session_info,
            limit=limit,
            score_threshold=score_threshold,
            filter=filter,
            level=level,
        )
        return result

    async def find(
        self,
        query: str,
        ctx: RequestContext,
        target_uri: Union[str, List[str]] = "",
        limit: int = 10,
        score_threshold: Optional[float] = None,
        filter: Optional[Dict] = None,
        level: Optional[List[int]] = None,
    ) -> Any:
        """Semantic search without session context.

        Args:
            query: Query string
            target_uri: Target directory URI(s), supports str or List[str]
            limit: Max results
            score_threshold: Score threshold
            filter: Metadata filters
            level: Filter by level (0=abstract, 1=overview, 2=file)

        Returns:
            FindResult
        """
        _ensure_non_empty_query(query)
        target_uri = validate_optional_viking_uris(target_uri, field_name="target_uri")
        viking_fs = self._ensure_initialized()
        result = await viking_fs.find(
            query=query,
            ctx=ctx,
            target_uri=target_uri,
            limit=limit,
            score_threshold=score_threshold,
            filter=filter,
            level=level,
        )
        return result

    async def resolve(
        self,
        query: str,
        ctx: RequestContext,
        agent_space: str = "default",
        user_ids: Optional[List[str]] = None,
        session_context: Optional[List[Dict[str, Any]]] = None,
        include_debug: bool = False,
        limits: Optional[Dict[str, int]] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Resolve a query into a temporary Query Resolution Pack.

        This method only performs OpenViking-side retrieval and packaging. It does
        not execute an agent task and does not commit memories.
        """
        _ensure_non_empty_query(query)
        viking_fs = self._ensure_initialized()
        started = time.perf_counter()
        requested_limits = limits or {}
        limits = {**DEFAULT_RESOLUTION_LIMITS, **requested_limits}
        if "pack_max_chars" not in requested_limits:
            limits["pack_max_chars"] = int(limits.get("pack_max_tokens", 6000)) * 4
        options = options or {}
        return_markdown = bool(options.get("return_markdown", True))
        return_structured = bool(options.get("return_structured", True))
        user_ids = user_ids or [ctx.user.user_id]
        agent_space = (agent_space or "default").strip() or "default"
        step_debug: Dict[str, Any] = {}
        llm_debug: Dict[str, Any] = {}
        pipeline_steps: List[Dict[str, Any]] = []

        def record_step(step_id: str, started_at: float, output: Dict[str, Any]) -> None:
            pipeline_steps.append(
                {
                    "id": step_id,
                    "name": RESOLUTION_STEP_NAMES[step_id],
                    "status": "ok",
                    "latency_ms": int((time.perf_counter() - started_at) * 1000),
                    **output,
                }
            )
            step_debug[step_id] = output

        resolution_id = self._resolution_id(query)
        step_started = time.perf_counter()
        intent, initial_pseudo_plan = await self._analyze_intent_and_build_plan_with_llm(
            query=query,
            agent_space=agent_space,
            session_context=session_context,
            llm_debug=llm_debug,
        )
        record_step(
            "step1_query_analysis",
            step_started,
            {
                "intent": intent,
                "session_context_items": len(session_context or []),
                "user_ids": user_ids,
                "agent_space": agent_space,
            },
        )
        record_step(
            "step2_initial_pseudo_plan",
            time.perf_counter(),
            {
                "plan_step_count": len(initial_pseudo_plan),
                "initial_pseudo_plan": initial_pseudo_plan,
                "llm_node": "intent_and_initial_plan",
            },
        )

        step_started = time.perf_counter()
        retrieval_queries = await self._build_retrieval_queries_with_llm(
            query=query,
            intent=intent,
            initial_pseudo_plan=initial_pseudo_plan,
            llm_debug=llm_debug,
        )
        record_step(
            "step3_retrieval_query_build",
            step_started,
            {
                "sources": list(retrieval_queries),
                "query_count": sum(len(queries) for queries in retrieval_queries.values()),
                "retrieval_queries": retrieval_queries,
            },
        )

        search_started = time.perf_counter()
        raw_candidates, retrieval_errors = await self._retrieve_resolution_candidates(
            query=query,
            ctx=ctx,
            agent_space=agent_space,
            user_ids=user_ids,
            limits=limits,
            retrieval_queries=retrieval_queries,
        )
        retrieval_ms = int((time.perf_counter() - search_started) * 1000)
        record_step(
            "step4_parallel_candidate_retrieval",
            search_started,
            {
                "candidate_counts": {
                    source: len(items) for source, items in raw_candidates.items()
                },
                "errors": retrieval_errors,
            },
        )

        read_started = time.perf_counter()
        selected_context, selection_rationale, discarded_or_deferred = await self._select_context(
            viking_fs=viking_fs,
            ctx=ctx,
            raw_candidates=raw_candidates,
            limits=limits,
            options=options,
        )
        read_ms = int((time.perf_counter() - read_started) * 1000)
        record_step(
            "step5_materialize_candidates",
            read_started,
            {
                "materialized_count": len(selection_rationale) + len(discarded_or_deferred),
                "selected_counts": self._selected_counts(selected_context),
            },
        )
        record_step(
            "step6_filter_dedupe_rank",
            read_started,
            {
                "selected_counts": self._selected_counts(selected_context),
                "selection_rationale_count": len(selection_rationale),
                "discarded_or_deferred_count": len(discarded_or_deferred),
            },
        )

        step_started = time.perf_counter()
        conflict_decision = await self._resolve_conflicts_and_trajectory_decision_with_llm(
            query=query,
            intent=intent,
            selected_context=selected_context,
            allow_trajectory_grounding=bool(options.get("allow_trajectory_grounding", True)),
            llm_debug=llm_debug,
        )
        conflicts = conflict_decision["conflicts"]
        trajectory_grounding = await self._maybe_read_trajectory_grounding(
            viking_fs=viking_fs,
            ctx=ctx,
            agent_space=agent_space,
            query=query,
            selected_context=selected_context,
            conflicts=conflicts,
            limits=limits,
            allow=bool(options.get("allow_trajectory_grounding", True)),
            decision=conflict_decision,
        )
        if trajectory_grounding:
            selected_context["trajectory_grounding"] = trajectory_grounding
        record_step(
            "step7_conflict_and_trajectory_grounding",
            step_started,
            {
                "conflict_count": len(conflicts),
                "conflicts": conflicts,
                "allow_trajectory_grounding": bool(options.get("allow_trajectory_grounding", True)),
                "trajectory_grounding_count": len(trajectory_grounding),
                "trajectory_decision": {
                    key: conflict_decision.get(key)
                    for key in ("need_trajectory_grounding", "reason", "grounding_queries")
                },
            },
        )

        step_started = time.perf_counter()
        record_step(
            "step8_final_context_merge",
            step_started,
            {
                "selected_counts": self._selected_counts(selected_context),
            },
        )

        step_started = time.perf_counter()
        revised_execution_outline = await self._build_revised_execution_outline_with_llm(
            query=query,
            intent=intent,
            selected_context=selected_context,
            conflicts=conflicts,
            llm_debug=llm_debug,
        )
        record_step(
            "step9_revised_execution_outline",
            step_started,
            {
                "outline_step_count": len(revised_execution_outline),
                "revised_execution_outline": revised_execution_outline,
            },
        )

        step_started = time.perf_counter()
        pack_markdown = self._render_pack_markdown(
            query=query,
            intent=intent,
            selected_context=selected_context,
            revised_execution_outline=revised_execution_outline,
            conflicts=conflicts,
            max_chars=limits["pack_max_chars"],
        )
        record_step(
            "step10_pack_assembly",
            step_started,
            {
                "pack_markdown_chars": len(pack_markdown),
                "return_markdown": return_markdown,
                "return_structured": return_structured,
            },
        )

        result: Dict[str, Any] = {
            "resolution_id": resolution_id,
            "query": query,
            "pipeline_steps": pipeline_steps,
        }
        if return_markdown:
            result["pack_markdown"] = pack_markdown
        if return_structured:
            result.update(
                {
                    "intent": intent,
                    "selected_context": selected_context,
                    "revised_execution_outline": revised_execution_outline,
                    "selection_rationale": selection_rationale,
                    "discarded_or_deferred": discarded_or_deferred,
                    "conflicts": conflicts,
                }
            )
        if include_debug:
            result["debug"] = {
                "steps": step_debug,
                "initial_pseudo_plan": initial_pseudo_plan,
                "retrieval_queries": retrieval_queries,
                "raw_candidates": raw_candidates,
                "retrieval_errors": retrieval_errors,
                "llm": llm_debug,
                "budgets": limits,
                "latency_ms": {
                    "retrieval": retrieval_ms,
                    "read_and_select": read_ms,
                    "total": int((time.perf_counter() - started) * 1000),
                },
            }
        return result

    def _selected_counts(self, selected_context: Dict[str, List[Dict[str, Any]]]) -> Dict[str, int]:
        return {source: len(items) for source, items in selected_context.items()}

    def _string_list(self, value: Any) -> List[str]:
        if not isinstance(value, list):
            return []
        return [self._one_line(item) for item in value if self._one_line(item)]

    def _plan_step_text(self, step: Dict[str, Any]) -> str:
        return self._one_line(step.get("goal") or step.get("step") or "")

    def _normalize_retrieval_queries(self, queries: Dict[str, Any]) -> Dict[str, List[str]]:
        normalized: Dict[str, List[str]] = {}
        for source in ("user_memory", "experiences", "tools_memory", "skills", "skills_memory"):
            items = queries.get(source, [])
            if not isinstance(items, list):
                continue
            source_queries: List[str] = []
            for item in items:
                if isinstance(item, str):
                    text = self._one_line(item)
                elif isinstance(item, dict):
                    text = self._one_line(item.get("query") or item.get("text") or "")
                else:
                    text = ""
                if text and text not in source_queries:
                    source_queries.append(text)
            if source_queries:
                normalized[source] = source_queries
        return normalized

    def _resolution_id(self, query: str) -> str:
        digest = hashlib.sha1(f"{time.time_ns()}:{query}".encode("utf-8")).hexdigest()[:10]
        return f"sr_{digest}"

    async def _complete_resolution_json(
        self,
        *,
        node: str,
        prompt: str,
        llm_debug: Dict[str, Any],
    ) -> Optional[Any]:
        started = time.perf_counter()
        node_debug: Dict[str, Any] = {"llm_used": False}
        try:
            from openviking.models.vlm.llm import parse_json_from_response
            from openviking_cli.utils.config import get_openviking_config

            vlm = get_openviking_config().vlm
            if not (vlm and vlm.is_available()):
                node_debug["fallback_reason"] = "vlm_unavailable"
                return None
            response = await vlm.get_completion_async(prompt=prompt)
            parsed = parse_json_from_response(response)
            if parsed is None:
                node_debug["fallback_reason"] = "json_parse_failed"
                return None
            node_debug["llm_used"] = True
            return parsed
        except Exception as exc:
            node_debug["fallback_reason"] = f"{type(exc).__name__}: {exc}"
            logger.warning("search-resolution LLM node failed for %s: %s", node, exc)
            return None
        finally:
            node_debug["model_latency_ms"] = int((time.perf_counter() - started) * 1000)
            llm_debug[node] = node_debug

    async def _analyze_intent_and_build_plan_with_llm(
        self,
        *,
        query: str,
        agent_space: str,
        session_context: Optional[List[Dict[str, Any]]],
        llm_debug: Dict[str, Any],
    ) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        fallback_intent = self._analyze_intent(query)
        fallback_plan = self._build_initial_pseudo_plan(query, fallback_intent, session_context)
        prompt = render_prompt(
            "query_resolution.intent_and_initial_plan",
            {
                "query": query,
                "agent_space": agent_space,
                "session_context_json": json.dumps(session_context or [], ensure_ascii=False),
            },
        )
        parsed = await self._complete_resolution_json(
            node="intent_and_initial_plan",
            prompt=prompt,
            llm_debug=llm_debug,
        )
        if not isinstance(parsed, dict):
            return fallback_intent, fallback_plan
        intent_payload = parsed.get("intent")
        if not isinstance(intent_payload, dict):
            intent_payload = parsed
        intent = {
            **fallback_intent,
            **{key: value for key, value in intent_payload.items() if value is not None},
        }
        needs = intent.get("needs")
        if not isinstance(needs, dict):
            intent["needs"] = fallback_intent["needs"]
        else:
            intent["needs"] = {**fallback_intent["needs"], **needs}
        if not isinstance(intent.get("likely_tools"), list):
            intent["likely_tools"] = fallback_intent["likely_tools"]
        fallback_plan = self._build_initial_pseudo_plan(query, intent, session_context)
        plan = self._normalize_initial_pseudo_plan(parsed.get("initial_pseudo_plan"))
        return intent, plan or fallback_plan

    def _normalize_initial_pseudo_plan(self, plan: Any) -> List[Dict[str, Any]]:
        if not isinstance(plan, list) or not plan:
            return []
        normalized: List[Dict[str, Any]] = []
        for index, item in enumerate(plan, 1):
            if not isinstance(item, dict):
                continue
            goal = self._one_line(item.get("goal") or item.get("step") or "")
            if not goal:
                continue
            normalized.append(
                {
                    "id": self._one_line(item.get("id") or f"p{index}"),
                    "goal": goal,
                    "expected_sources": self._string_list(item.get("expected_sources")),
                    "retrieval_hints": self._string_list(item.get("retrieval_hints")),
                }
            )
        return normalized

    async def _build_retrieval_queries_with_llm(
        self,
        *,
        query: str,
        intent: Dict[str, Any],
        initial_pseudo_plan: List[Dict[str, Any]],
        llm_debug: Dict[str, Any],
    ) -> Dict[str, List[str]]:
        fallback = self._build_retrieval_queries(query, intent, initial_pseudo_plan)
        prompt = render_prompt(
            "query_resolution.retrieval_queries",
            {
                "query": query,
                "intent_json": json.dumps(intent, ensure_ascii=False),
                "initial_pseudo_plan_json": json.dumps(
                    initial_pseudo_plan, ensure_ascii=False
                ),
            },
        )
        parsed = await self._complete_resolution_json(
            node="retrieval_query_build",
            prompt=prompt,
            llm_debug=llm_debug,
        )
        if not isinstance(parsed, dict):
            return fallback
        queries = parsed.get("retrieval_queries")
        if not isinstance(queries, dict):
            return fallback
        normalized = self._normalize_retrieval_queries(queries)
        for source, fallback_queries in fallback.items():
            if not normalized.get(source):
                normalized[source] = fallback_queries
        return normalized


    def _analyze_intent(self, query: str) -> Dict[str, Any]:
        lower = query.lower()
        write_terms = ("write", "edit", "create", "delete", "commit", "实现", "修改", "新增", "删除")
        tool_terms = ("file", "代码", "repo", "文档", "实现", "api", "接口", "检索", "search")
        design_terms = ("方案", "设计", "架构", "design", "architecture", "proposal")
        likely_tools: List[str] = ["openviking_search"]
        if any(term in lower for term in tool_terms):
            likely_tools.extend(["openviking_read", "openviking_find"])
        if "skill" in lower or "技能" in query:
            likely_tools.append("openviking_skill_search")
        requires_write = any(term in lower for term in write_terms)
        if any(term in lower for term in design_terms):
            task_type = "design_synthesis"
        elif "review" in lower or "看下" in query:
            task_type = "analysis"
        else:
            task_type = "query_resolution"
        return {
            "task_type": task_type,
            "domain": self._infer_domain(query),
            "requires_tools": True,
            "requires_write": requires_write,
            "risk_level": "write" if requires_write else "read_only",
            "likely_tools": list(dict.fromkeys(likely_tools)),
            "needs": {
                "user_memory": True,
                "experience": True,
                "trajectory_grounding": False,
                "skills": True,
                "tools_memory": True,
            },
        }

    def _infer_domain(self, query: str) -> str:
        lower = query.lower()
        if "skill" in lower or "memory" in lower or "记忆" in query:
            return "agent_memory_skill"
        if "openviking" in lower:
            return "openviking"
        if "api" in lower or "接口" in query:
            return "api"
        return "general"

    def _build_initial_pseudo_plan(
        self,
        query: str,
        intent: Dict[str, Any],
        session_context: Optional[List[Dict[str, Any]]],
    ) -> List[Dict[str, Any]]:
        steps = [
            "Clarify the user's explicit goal and constraints.",
            "Retrieve relevant user memory, agent experience, tool guidance, and skills.",
            "Filter unrelated or conflicting candidates before packaging.",
            "Return a compact guidance pack for the current query only.",
        ]
        if intent["task_type"] == "design_synthesis":
            steps.insert(1, "Break the design task into reusable concepts and implementation boundaries.")
        if session_context:
            steps.insert(1, "Use recent session context only when it changes the query interpretation.")
        return [
            {
                "step": step,
                "retrieval_queries": [query, f"{intent['domain']} {intent['task_type']} {step}"],
            }
            for step in steps
        ]

    def _build_retrieval_queries(
        self,
        query: str,
        intent: Dict[str, Any],
        initial_pseudo_plan: List[Dict[str, Any]],
    ) -> Dict[str, List[str]]:
        plan_text = " ".join(self._plan_step_text(step) for step in initial_pseudo_plan)
        base = f"{query}\ntask_type: {intent['task_type']}\ndomain: {intent['domain']}"
        return {
            "user_memory": [query, f"{base}\nuser preferences constraints entities events"],
            "experiences": [base, f"{query}\n{plan_text}\nreusable experience approach anti-pattern"],
            "tools_memory": [f"{base}\n{' '.join(intent.get('likely_tools', []))} tool guidance failures"],
            "skills": [base, f"{query}\n{plan_text}\nSKILL.md task workflow"],
            "skills_memory": [f"{base}\nskill usage recommendation failures"],
        }

    async def _retrieve_resolution_candidates(
        self,
        query: str,
        ctx: RequestContext,
        agent_space: str,
        user_ids: List[str],
        limits: Dict[str, int],
        retrieval_queries: Dict[str, List[str]],
    ) -> tuple[Dict[str, List[Dict[str, Any]]], Dict[str, str]]:
        agent_root = f"viking://agent/{agent_space}"
        targets = {
            "user_memory": [f"viking://user/{user_id}/memories" for user_id in user_ids]
            or ["viking://user/memories"],
            "experiences": [f"{agent_root}/memories/experiences"],
            "tools_memory": [f"{agent_root}/memories/tools"],
            "skills": [f"{agent_root}/skills", "viking://agent/skills"],
            "skills_memory": [f"{agent_root}/memories/skills"],
        }

        async def run_one(source: str) -> tuple[str, List[Dict[str, Any]], str | None]:
            seen: set[str] = set()
            items: List[Dict[str, Any]] = []
            try:
                for retrieval_query in retrieval_queries.get(source, [query]):
                    result = await self.find(
                        query=retrieval_query,
                        ctx=ctx,
                        target_uri=targets[source],
                        limit=limits.get(source, 5),
                        level=None,
                    )
                    for item in self._extract_result_items(result):
                        uri = item.get("uri")
                        if not uri or uri in seen:
                            continue
                        seen.add(uri)
                        item["source"] = source
                        items.append(item)
                items.sort(key=lambda item: self._score(item), reverse=True)
                return source, items[: limits.get(source, 5)], None
            except Exception as exc:  # best-effort per source
                logger.warning("search-resolution retriever failed for %s: %s", source, exc)
                return source, [], str(exc)

        results = await asyncio.gather(*(run_one(source) for source in targets))
        candidates: Dict[str, List[Dict[str, Any]]] = {}
        errors: Dict[str, str] = {}
        for source, items, error in results:
            candidates[source] = items
            if error:
                errors[source] = error
        return candidates, errors

    def _extract_result_items(self, result: Any) -> List[Dict[str, Any]]:
        if hasattr(result, "to_dict"):
            result = result.to_dict()
        if not isinstance(result, dict):
            return []
        items: List[Dict[str, Any]] = []
        for key in ("memories", "skills", "resources", "items"):
            value = result.get(key, [])
            if isinstance(value, list):
                items.extend(item for item in value if isinstance(item, dict))
        return items

    async def _select_context(
        self,
        viking_fs: VikingFS,
        ctx: RequestContext,
        raw_candidates: Dict[str, List[Dict[str, Any]]],
        limits: Dict[str, int],
        options: Dict[str, Any],
    ) -> tuple[Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        selected: Dict[str, List[Dict[str, Any]]] = {
            "user_memory": [],
            "agent_experiences": [],
            "trajectory_grounding": [],
            "tool_guidance": [],
            "skills": [],
        }
        rationale: List[Dict[str, Any]] = []
        discarded: List[Dict[str, Any]] = []
        seen_content: set[str] = set()
        source_to_selected = {
            "user_memory": "user_memory",
            "experiences": "agent_experiences",
            "tools_memory": "tool_guidance",
            "skills": "skills",
            "skills_memory": "skills",
        }

        tasks = []
        for source, items in raw_candidates.items():
            for idx, item in enumerate(items):
                tasks.append(self._materialize_candidate(viking_fs, ctx, source, item, idx, options))
        materialized = await asyncio.gather(*tasks, return_exceptions=True)

        per_source_counts: Dict[str, int] = {}
        for entry in materialized:
            if isinstance(entry, Exception):
                continue
            source = entry["source"]
            target_key = source_to_selected.get(source)
            if not target_key:
                continue
            max_count = limits.get(source, 5)
            if per_source_counts.get(source, 0) >= max_count:
                discarded.append(
                    {
                        "source": source,
                        "uri": entry.get("uri"),
                        "reason": "source limit reached",
                    }
                )
                continue
            hash_text = _compact_resolution_text(
                entry.get("content") or entry.get("abstract") or entry.get("uri", "")
            )
            content_hash = hashlib.sha1(hash_text.encode("utf-8")).hexdigest()
            if content_hash in seen_content:
                discarded.append(
                    {
                        "source": source,
                        "uri": entry.get("uri"),
                        "reason": "duplicate content",
                    }
                )
                continue
            seen_content.add(content_hash)
            selected[target_key].append(entry)
            per_source_counts[source] = per_source_counts.get(source, 0) + 1
            rationale.append(
                {
                    "source": source,
                    "uri": entry.get("uri"),
                    "reason": f"selected from {source} by score and source budget",
                    "score": entry.get("score", 0.0),
                    "content_mode": entry.get("content_mode", "summary"),
                }
            )
        return selected, rationale, discarded

    async def _materialize_candidate(
        self,
        viking_fs: VikingFS,
        ctx: RequestContext,
        source: str,
        item: Dict[str, Any],
        idx: int,
        options: Dict[str, Any],
    ) -> Dict[str, Any]:
        uri = item.get("uri", "")
        content = ""
        content_mode = self._content_mode_for(source, item, idx, options)
        if uri and content_mode in {"full", "summary"}:
            try:
                content = await viking_fs.read(uri, ctx=ctx)
            except Exception:
                content = ""
        content = _compact_resolution_text(content, 5000)
        if content_mode == "summary":
            content = self._truncate(content, 1800)
        elif content_mode == "full":
            content = self._truncate(content, 5000)
        abstract = _compact_resolution_text(
            item.get("abstract") or item.get("description") or "", 1800
        )
        return {
            "source": source,
            "uri": _compact_resolution_text(uri, 1000),
            "score": self._score(item),
            "abstract": abstract,
            "content": content,
            "content_mode": content_mode if content else "link_only",
            "metadata": {
                key: item.get(key)
                for key in ("name", "level", "context_type", "updated_at", "created_at")
                if key in item
            },
        }

    def _content_mode_for(
        self,
        source: str,
        item: Dict[str, Any],
        idx: int,
        options: Dict[str, Any],
    ) -> str:
        configured = options.get("skill_content_mode") if source in {"skills", "skills_memory"} else None
        if configured in {"full", "summary", "link_only"}:
            return configured
        if source == "skills":
            return "summary" if idx < 2 else "link_only"
        if source == "experiences":
            return "full" if idx < 2 else "summary"
        if source == "user_memory":
            return "summary"
        return "summary" if idx < 3 else "link_only"

    def _score(self, item: Dict[str, Any]) -> float:
        try:
            return float(item.get("score", 0.0) or 0.0)
        except (TypeError, ValueError):
            return 0.0

    async def _resolve_conflicts_and_trajectory_decision_with_llm(
        self,
        *,
        query: str,
        intent: Dict[str, Any],
        selected_context: Dict[str, List[Dict[str, Any]]],
        allow_trajectory_grounding: bool,
        llm_debug: Dict[str, Any],
    ) -> Dict[str, Any]:
        fallback_conflicts = self._resolve_conflicts(query, selected_context)
        fallback = {
            "conflicts": fallback_conflicts,
            "need_trajectory_grounding": allow_trajectory_grounding
            and (bool(fallback_conflicts) or not selected_context.get("agent_experiences")),
            "reason": "fallback: experience missing or conflict exists",
            "grounding_queries": [query],
        }
        prompt = render_prompt(
            "query_resolution.conflict_trajectory_decision",
            {
                "query": query,
                "intent_json": json.dumps(intent, ensure_ascii=False),
                "selected_context_json": json.dumps(
                    self._compact_selected_context(selected_context), ensure_ascii=False
                ),
                "allow_trajectory_grounding": str(bool(allow_trajectory_grounding)).lower(),
            },
        )
        parsed = await self._complete_resolution_json(
            node="conflict_trajectory_decision",
            prompt=prompt,
            llm_debug=llm_debug,
        )
        if not isinstance(parsed, dict):
            return fallback
        conflicts = parsed.get("conflicts", [])
        if not isinstance(conflicts, list):
            conflicts = fallback_conflicts
        normalized_conflicts = []
        for item in conflicts:
            if not isinstance(item, dict):
                continue
            resolution = self._one_line(item.get("resolution") or "")
            if not resolution:
                continue
            normalized_conflicts.append(
                {
                    "items": self._string_list(item.get("items")),
                    "type": self._one_line(item.get("type") or "conflict"),
                    "resolution": resolution,
                }
            )
        return {
            "conflicts": normalized_conflicts,
            "need_trajectory_grounding": bool(parsed.get("need_trajectory_grounding"))
            and allow_trajectory_grounding,
            "reason": self._one_line(parsed.get("reason") or fallback["reason"]),
            "grounding_queries": self._string_list(parsed.get("grounding_queries")) or [query],
        }

    def _resolve_conflicts(
        self, query: str, selected_context: Dict[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        conflicts: List[Dict[str, Any]] = []
        if selected_context.get("user_memory"):
            conflicts.append(
                {
                    "items": ["current_query", "historical_user_memory"],
                    "type": "current_query_over_historical_memory",
                    "resolution": "当前 query 的显式要求优先于历史 user memory。",
                }
            )
        return conflicts

    async def _maybe_read_trajectory_grounding(
        self,
        viking_fs: VikingFS,
        ctx: RequestContext,
        agent_space: str,
        query: str,
        selected_context: Dict[str, List[Dict[str, Any]]],
        conflicts: List[Dict[str, Any]],
        limits: Dict[str, int],
        allow: bool,
        decision: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not allow:
            return []
        if decision is not None:
            need_grounding = bool(decision.get("need_trajectory_grounding"))
            grounding_queries = self._string_list(decision.get("grounding_queries")) or [query]
        else:
            need_grounding = not (selected_context.get("agent_experiences") and not conflicts)
            grounding_queries = [query]
        if not need_grounding:
            return []
        raw_items: List[Dict[str, Any]] = []
        seen: set[str] = set()
        for grounding_query in grounding_queries:
            try:
                result = await self.find(
                    query=grounding_query,
                    ctx=ctx,
                    target_uri=f"viking://agent/{agent_space}/memories/trajectories",
                    limit=limits.get("trajectory_grounding", 2),
                )
            except Exception:
                continue
            for item in self._extract_result_items(result):
                uri = item.get("uri", "")
                if uri in seen:
                    continue
                seen.add(uri)
                raw_items.append(item)
        raw_items.sort(key=lambda item: self._score(item), reverse=True)
        grounding = []
        for item in raw_items[: limits.get("trajectory_grounding", 2)]:
            uri = item.get("uri", "")
            content = ""
            try:
                if uri:
                    content = await viking_fs.read(uri, ctx=ctx)
            except Exception:
                content = ""
            grounding.append(
                {
                    "source": "trajectory_grounding",
                    "uri": uri,
                    "score": self._score(item),
                    "summary": self._truncate(content or item.get("abstract", ""), 1200),
                    "content_mode": "summary" if content else "link_only",
                }
            )
        return grounding

    def _build_revised_execution_outline(
        self,
        query: str,
        intent: Dict[str, Any],
        selected_context: Dict[str, List[Dict[str, Any]]],
    ) -> List[str]:
        outline = [
            "Start from the user's explicit query and constraints.",
            "Use the selected user memory only when it is directly relevant.",
        ]
        if selected_context.get("agent_experiences"):
            outline.append("Apply the selected agent experiences as reusable execution guidance.")
        if selected_context.get("skills"):
            outline.append("Use the selected skills or SKILL.md summaries for task-specific workflow guidance.")
        if selected_context.get("tool_guidance"):
            outline.append("Respect the selected tool guidance and known failure notes.")
        if selected_context.get("trajectory_grounding"):
            outline.append("Use trajectory grounding only as evidence, not as a script to replay.")
        outline.append("Produce the final answer or execution plan in the same language as the query.")
        return outline

    async def _build_revised_execution_outline_with_llm(
        self,
        *,
        query: str,
        intent: Dict[str, Any],
        selected_context: Dict[str, List[Dict[str, Any]]],
        conflicts: List[Dict[str, Any]],
        llm_debug: Dict[str, Any],
    ) -> List[str]:
        fallback = self._build_revised_execution_outline(query, intent, selected_context)
        prompt = render_prompt(
            "query_resolution.revised_execution_outline",
            {
                "query": query,
                "intent_json": json.dumps(intent, ensure_ascii=False),
                "selected_context_json": json.dumps(
                    self._compact_selected_context(selected_context), ensure_ascii=False
                ),
                "conflicts_json": json.dumps(conflicts, ensure_ascii=False),
            },
        )
        parsed = await self._complete_resolution_json(
            node="revised_execution_outline",
            prompt=prompt,
            llm_debug=llm_debug,
        )
        if not isinstance(parsed, dict):
            return fallback
        outline = self._string_list(parsed.get("revised_execution_outline"))
        return outline or fallback

    def _compact_selected_context(
        self, selected_context: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        compact: Dict[str, List[Dict[str, Any]]] = {}
        for source, items in selected_context.items():
            compact[source] = []
            for item in items[:5]:
                compact[source].append(
                    {
                        "uri": item.get("uri", ""),
                        "score": item.get("score", 0.0),
                        "abstract": self._truncate(self._one_line(item.get("abstract", "")), 300),
                        "content": self._truncate(
                            self._one_line(item.get("content") or item.get("summary") or ""),
                            500,
                        ),
                        "content_mode": item.get("content_mode", ""),
                    }
                )
        return compact

    def _render_pack_markdown(
        self,
        query: str,
        intent: Dict[str, Any],
        selected_context: Dict[str, List[Dict[str, Any]]],
        revised_execution_outline: List[str],
        conflicts: List[Dict[str, Any]],
        max_chars: int,
    ) -> str:
        sections = [
            "# Query Resolution Pack",
            f"## Original Query\n{query}",
            "## Intent\n"
            + "\n".join(
                [
                    f"- Task type: {intent.get('task_type')}",
                    f"- Domain: {intent.get('domain')}",
                    f"- Risk: {intent.get('risk_level')}",
                    f"- Likely tools: {', '.join(intent.get('likely_tools', []))}",
                ]
            ),
        ]
        self._append_context_section(sections, "Relevant User Memory", selected_context["user_memory"])
        self._append_context_section(
            sections, "Relevant Agent Experiences", selected_context["agent_experiences"]
        )
        self._append_context_section(sections, "Relevant Skills", selected_context["skills"])
        self._append_context_section(sections, "Tool Guidance", selected_context["tool_guidance"])
        self._append_grounding_section(
            sections, "Trajectory Grounding", selected_context["trajectory_grounding"]
        )
        if conflicts:
            sections.append(
                "## Conflict Resolution\n"
                + "\n".join(f"- {item['resolution']}" for item in conflicts)
            )
        sections.append(
            "## Suggested Execution Outline\n"
            + "\n".join(f"{idx}. {step}" for idx, step in enumerate(revised_execution_outline, 1))
        )
        sections.append(
            "## Notes For The Agent\n"
            "- Treat this pack as guidance for the current query only.\n"
            "- Prefer the user's explicit request over historical memory when they conflict.\n"
            "- Do not assume omitted memories or skills are irrelevant globally."
        )
        return self._truncate("\n\n".join(sections), max_chars)

    def _append_context_section(
        self, sections: List[str], title: str, items: List[Dict[str, Any]]
    ) -> None:
        if not items:
            sections.append(f"## {title}\n- No high-confidence item selected.")
            return
        lines = []
        for item in items:
            lines.append(f"- uri: {item.get('uri', '')}")
            if item.get("abstract"):
                lines.append(f"  abstract: {self._one_line(item['abstract'])}")
            if item.get("content"):
                lines.append(f"  content: {self._one_line(item['content'])}")
        sections.append(f"## {title}\n" + "\n".join(lines))

    def _append_grounding_section(
        self, sections: List[str], title: str, items: List[Dict[str, Any]]
    ) -> None:
        if not items:
            return
        lines = []
        for item in items:
            lines.append(f"- uri: {item.get('uri', '')}")
            if item.get("summary"):
                lines.append(f"  summary: {self._one_line(item['summary'])}")
        sections.append(f"## {title}\n" + "\n".join(lines))

    def _one_line(self, text: str) -> str:
        return " ".join(str(text).split())

    def _truncate(self, text: str, max_chars: int) -> str:
        if not text:
            return ""
        if len(text) <= max_chars:
            return text
        return text[: max_chars - 16].rstrip() + "\n...[truncated]"

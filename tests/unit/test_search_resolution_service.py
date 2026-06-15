from types import SimpleNamespace

import pytest

from openviking.service.search_service import SearchService


class FakeVikingFS:
    async def read(self, uri, ctx=None):
        return f"content for {uri}"


class FakeBytesVikingFS:
    async def read(self, uri, ctx=None):
        return f"byte content for {uri}".encode()


@pytest.mark.asyncio
async def test_search_resolution_service_builds_pack(monkeypatch):
    service = SearchService(FakeVikingFS())
    ctx = SimpleNamespace(user=SimpleNamespace(user_id="test_user"))

    async def fake_find(*, query, ctx, target_uri="", limit=10, **kwargs):
        uri = target_uri[0] if isinstance(target_uri, list) else target_uri
        if "experiences" in uri:
            return {
                "memories": [
                    {
                        "uri": "viking://agent/default/memories/experiences/design.md",
                        "score": 0.9,
                        "abstract": "Use prior design experience.",
                    }
                ]
            }
        if "tools" in uri:
            return {
                "memories": [
                    {
                        "uri": "viking://agent/default/memories/tools/search.md",
                        "score": 0.8,
                        "abstract": "Search narrowly first.",
                    }
                ]
            }
        if "skills" in uri:
            return {
                "skills": [
                    {
                        "uri": "viking://agent/default/skills/doc-analysis/SKILL.md",
                        "score": 0.7,
                        "abstract": "Analyze design docs.",
                    }
                ]
            }
        return {"memories": []}

    monkeypatch.setattr(service, "find", fake_find)

    async def fake_complete_json(*, node, prompt, llm_debug):
        llm_debug[node] = {"llm_used": False, "fallback_reason": "test"}
        return None

    monkeypatch.setattr(service, "_complete_resolution_json", fake_complete_json)

    result = await service.resolve(
        query="帮我设计 OpenViking memory skill 方案",
        ctx=ctx,
        agent_space="default",
        include_debug=True,
    )

    assert result["resolution_id"].startswith("sr_")
    assert result["intent"]["task_type"] == "design_synthesis"
    assert result["selected_context"]["agent_experiences"]
    assert result["selected_context"]["tool_guidance"]
    assert result["selected_context"]["skills"]
    assert [step["id"] for step in result["pipeline_steps"]] == [
        "step1_query_analysis",
        "step2_initial_pseudo_plan",
        "step3_retrieval_query_build",
        "step4_parallel_candidate_retrieval",
        "step5_materialize_candidates",
        "step6_filter_dedupe_rank",
        "step7_conflict_and_trajectory_grounding",
        "step8_final_context_merge",
        "step9_revised_execution_outline",
        "step10_pack_assembly",
    ]
    assert "# Query Resolution Pack" in result["pack_markdown"]
    assert "Suggested Execution Outline" in result["pack_markdown"]
    assert "retrieval_queries" in result["debug"]
    assert "step6_filter_dedupe_rank" in result["debug"]["steps"]


@pytest.mark.asyncio
async def test_search_resolution_service_uses_llm_plan_guided_path(monkeypatch):
    service = SearchService(FakeVikingFS())
    ctx = SimpleNamespace(user=SimpleNamespace(user_id="test_user"))

    async def fake_find(*, query, ctx, target_uri="", limit=10, **kwargs):
        uri = target_uri[0] if isinstance(target_uri, list) else target_uri
        if "experiences" in uri:
            return {
                "memories": [
                    {
                        "uri": "viking://agent/default/memories/experiences/plan.md",
                        "score": 0.9,
                        "abstract": "Use plan-guided retrieval.",
                    }
                ]
            }
        if "tools" in uri:
            return {"memories": []}
        if "skills" in uri:
            return {
                "skills": [
                    {
                        "uri": "viking://agent/default/skills/retrieval/SKILL.md",
                        "score": 0.8,
                        "abstract": "Retrieve skills by plan step.",
                    }
                ]
            }
        return {"memories": []}

    async def fake_complete_json(*, node, prompt, llm_debug):
        llm_debug[node] = {"llm_used": True, "model_latency_ms": 1}
        if node == "intent_and_initial_plan":
            return {
                "intent": {
                    "task_type": "research_and_design",
                    "domain": "agent_memory_skill",
                    "explicit_constraints": ["only OpenViking side"],
                    "implicit_needs": ["plan-guided retrieval"],
                    "requires_tools": True,
                    "requires_write": False,
                    "risk_level": "read_only",
                    "likely_tools": ["openviking_find", "openviking_read"],
                    "needs": {
                        "user_memory": True,
                        "experience": True,
                        "trajectory_grounding": False,
                        "skills": True,
                        "tools_memory": True,
                    },
                },
                "initial_pseudo_plan": [
                    {
                        "id": "p1",
                        "goal": "Analyze plan-guided retrieval",
                        "expected_sources": ["experiences", "skills"],
                        "retrieval_hints": ["plan-guided retrieval"],
                    }
                ],
                "plan_confidence": 0.9,
            }
        if node == "retrieval_query_build":
            return {
                "retrieval_queries": {
                    "experiences": [
                        {"from": "p1", "query": "plan-guided retrieval experience"}
                    ],
                    "skills": [{"from": "p1", "query": "plan-step skill retrieval"}],
                }
            }
        if node == "conflict_trajectory_decision":
            return {
                "conflicts": [],
                "need_trajectory_grounding": False,
                "reason": "experience is sufficient",
                "grounding_queries": [],
            }
        if node == "revised_execution_outline":
            return {
                "revised_execution_outline": [
                    "Use plan steps as retrieval queries.",
                    "Select only relevant skills and experiences.",
                ]
            }
        return None

    monkeypatch.setattr(service, "find", fake_find)
    monkeypatch.setattr(service, "_complete_resolution_json", fake_complete_json)

    result = await service.resolve(
        query="参考外部方案完善 OpenViking search-resolution 方案",
        ctx=ctx,
        include_debug=True,
    )

    assert result["intent"]["task_type"] == "research_and_design"
    assert result["debug"]["initial_pseudo_plan"][0]["id"] == "p1"
    assert result["debug"]["retrieval_queries"]["experiences"] == [
        "plan-guided retrieval experience"
    ]
    assert result["revised_execution_outline"][0] == "Use plan steps as retrieval queries."
    assert result["debug"]["llm"]["intent_and_initial_plan"]["llm_used"] is True


@pytest.mark.asyncio
async def test_search_resolution_service_respects_return_options(monkeypatch):
    service = SearchService(FakeVikingFS())
    ctx = SimpleNamespace(user=SimpleNamespace(user_id="test_user"))

    async def fake_find(*, query, ctx, target_uri="", limit=10, **kwargs):
        return {"memories": []}

    async def fake_complete_json(*, node, prompt, llm_debug):
        llm_debug[node] = {"llm_used": False, "fallback_reason": "test"}
        return None

    monkeypatch.setattr(service, "find", fake_find)
    monkeypatch.setattr(service, "_complete_resolution_json", fake_complete_json)

    result = await service.resolve(
        query="summarize current context",
        ctx=ctx,
        options={"return_markdown": False, "return_structured": False},
    )

    assert result["resolution_id"].startswith("sr_")
    assert "pack_markdown" not in result
    assert "selected_context" not in result
    assert result["pipeline_steps"][-1]["return_markdown"] is False
    assert result["pipeline_steps"][-1]["return_structured"] is False


@pytest.mark.asyncio
async def test_search_resolution_service_normalizes_bytes_candidates(monkeypatch):
    service = SearchService(FakeBytesVikingFS())
    ctx = SimpleNamespace(user=SimpleNamespace(user_id="test_user"))

    async def fake_find(*, query, ctx, target_uri="", limit=10, **kwargs):
        uri = target_uri[0] if isinstance(target_uri, list) else target_uri
        if "experiences" in uri:
            return {
                "memories": [
                    {
                        "uri": b"viking://agent/default/memories/experiences/bytes.md",
                        "score": 0.9,
                        "abstract": b"Use byte-backed experience.",
                    }
                ]
            }
        return {"memories": []}

    async def fake_complete_json(*, node, prompt, llm_debug):
        llm_debug[node] = {"llm_used": False, "fallback_reason": "test"}
        return None

    monkeypatch.setattr(service, "find", fake_find)
    monkeypatch.setattr(service, "_complete_resolution_json", fake_complete_json)

    result = await service.resolve(
        query="handle byte candidates",
        ctx=ctx,
        include_debug=True,
    )

    experience = result["selected_context"]["agent_experiences"][0]
    assert experience["uri"] == "viking://agent/default/memories/experiences/bytes.md"
    assert experience["abstract"] == "Use byte-backed experience."
    assert "byte content" in experience["content"]

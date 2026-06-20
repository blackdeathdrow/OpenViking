# Copyright (c) 2026 Beijing Volcano Engine Technology Co., Ltd.
# SPDX-License-Identifier: AGPL-3.0
"""Tests for rerank timeout configuration."""

from unittest.mock import Mock, patch

import httpx

from openviking.models.rerank.cohere_rerank import CohereRerankClient
from openviking.models.rerank.openai_rerank import OpenAIRerankClient
from openviking.models.rerank.volcengine_rerank import RerankClient as VolcengineRerankClient
from openviking_cli.utils.config.rerank_config import RerankConfig


def test_rerank_config_default_timeouts():
    """RerankConfig should default to connect=10 and read=30."""
    config = RerankConfig(provider="openai", api_key="key", api_base="https://example.com/rerank")
    assert config.connect_timeout == 10
    assert config.read_timeout == 30


def test_rerank_config_explicit_timeouts():
    """RerankConfig should accept explicit connect/read timeouts."""
    config = RerankConfig(
        provider="openai",
        api_key="key",
        api_base="https://example.com/rerank",
        connect_timeout=5,
        read_timeout=120,
    )
    assert config.connect_timeout == 5
    assert config.read_timeout == 120


def test_openai_rerank_client_timeouts():
    """OpenAIRerankClient should store separate connect/read timeouts."""
    client = OpenAIRerankClient(
        api_key="test-key",
        api_base="https://api.example.com/v1",
        model_name="gpt-4",
        connect_timeout=5,
        read_timeout=120,
    )
    assert client.connect_timeout == 5
    assert client.read_timeout == 120


@patch("openviking.models.rerank.openai_rerank.requests.post")
def test_openai_rerank_batch_passes_timeout_tuple(mock_post):
    """OpenAIRerankClient should pass (connect, read) tuple to requests.post."""
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"results": [{"index": 0, "relevance_score": 0.9}]}
    mock_post.return_value = mock_response

    client = OpenAIRerankClient(
        api_key="test-key",
        api_base="https://api.example.com/v1",
        model_name="gpt-4",
        connect_timeout=5,
        read_timeout=120,
    )
    client.rerank_batch(query="test query", documents=["doc1"])

    call_kwargs = mock_post.call_args.kwargs
    assert call_kwargs["timeout"] == (5, 120)


def test_openai_rerank_from_config_timeouts():
    """from_config should propagate connect/read timeouts to OpenAIRerankClient."""
    config = RerankConfig(
        provider="openai",
        api_key="key",
        api_base="https://example.com/rerank",
        connect_timeout=5,
        read_timeout=120,
    )
    client = OpenAIRerankClient.from_config(config)
    assert client.connect_timeout == 5
    assert client.read_timeout == 120


def test_cohere_rerank_client_timeouts():
    """CohereRerankClient should use httpx.Timeout with separate connect/read values."""
    client = CohereRerankClient(
        api_key="test-key",
        connect_timeout=5,
        read_timeout=120,
    )
    assert isinstance(client._client.timeout, httpx.Timeout)
    assert client._client.timeout.connect == 5
    assert client._client.timeout.read == 120


def test_cohere_rerank_from_config_timeouts():
    """from_config should propagate connect/read timeouts to CohereRerankClient."""
    config = RerankConfig(
        provider="cohere",
        api_key="key",
        connect_timeout=5,
        read_timeout=120,
    )
    client = CohereRerankClient.from_config(config)
    assert client._client.timeout.connect == 5
    assert client._client.timeout.read == 120


def test_volcengine_rerank_client_timeouts():
    """VolcengineRerankClient should store separate connect/read timeouts."""
    client = VolcengineRerankClient(
        ak="ak",
        sk="sk",
        connect_timeout=5,
        read_timeout=120,
    )
    assert client.connect_timeout == 5
    assert client.read_timeout == 120


def test_volcengine_rerank_from_config_timeouts():
    """from_config should propagate connect/read timeouts to VolcengineRerankClient."""
    config = RerankConfig(
        provider="vikingdb",
        ak="ak",
        sk="sk",
        connect_timeout=5,
        read_timeout=120,
    )
    client = VolcengineRerankClient.from_config(config)
    assert client.connect_timeout == 5
    assert client.read_timeout == 120

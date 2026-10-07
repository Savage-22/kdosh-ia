import json
import logging

import psycopg
from psycopg.rows import dict_row

from app.config.env import database_url

logger = logging.getLogger(__name__)


async def record_usage(request_type: str, requested_model: str, completion: dict, sources: list) -> None:
    usage = completion.get("usage") or {}
    prompt_details = usage.get("prompt_tokens_details") or {}
    completion_details = usage.get("completion_tokens_details") or {}
    cost_details = usage.get("cost_details") or {}
    try:
        async with await psycopg.AsyncConnection.connect(database_url()) as connection:
            await connection.execute(
                """INSERT INTO ai_usage_logs (
                    openrouter_generation_id, request_type, requested_model, resolved_model,
                    prompt_tokens, completion_tokens, total_tokens, cached_tokens, reasoning_tokens,
                    cost_usd, upstream_prompt_cost_usd, upstream_completion_cost_usd, document_sources
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)""",
                (
                    completion.get("id"), request_type, requested_model,
                    completion.get("model") or requested_model,
                    usage.get("prompt_tokens") or 0, usage.get("completion_tokens") or 0,
                    usage.get("total_tokens") or 0, prompt_details.get("cached_tokens") or 0,
                    completion_details.get("reasoning_tokens") or 0, usage.get("cost"),
                    cost_details.get("upstream_inference_prompt_cost"),
                    cost_details.get("upstream_inference_completions_cost"), json.dumps(sources),
                ),
            )
    except Exception:
        logger.exception("No se pudo registrar el uso de OpenRouter")


async def usage_summary() -> list[dict]:
    async with await psycopg.AsyncConnection.connect(database_url(), row_factory=dict_row) as connection:
        async with connection.cursor() as cursor:
            await cursor.execute("""
                SELECT resolved_model AS "model", COUNT(*)::INTEGER AS "requestCount",
                    SUM(prompt_tokens)::INTEGER AS "promptTokens",
                    SUM(completion_tokens)::INTEGER AS "completionTokens",
                    SUM(total_tokens)::INTEGER AS "totalTokens",
                    COALESCE(SUM(cost_usd), 0)::TEXT AS "totalCostUsd",
                    COALESCE(AVG(cost_usd), 0)::TEXT AS "averageCostUsd"
                FROM ai_usage_logs GROUP BY resolved_model
                ORDER BY SUM(cost_usd) DESC NULLS LAST, resolved_model ASC
            """)
            return await cursor.fetchall()

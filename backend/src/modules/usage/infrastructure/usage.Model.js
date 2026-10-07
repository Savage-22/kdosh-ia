import { pool } from '../../../config/database.js'

class UsageModel {
    static async create({ requestType, requestedModel, completion, documentSources = [] }) {
        const usage = completion.usage || {}
        const promptDetails = usage.prompt_tokens_details || {}
        const completionDetails = usage.completion_tokens_details || {}
        const costDetails = usage.cost_details || {}

        await pool.query(
            `INSERT INTO ai_usage_logs (
                openrouter_generation_id, request_type, requested_model, resolved_model,
                prompt_tokens, completion_tokens, total_tokens, cached_tokens, reasoning_tokens,
                cost_usd, upstream_prompt_cost_usd, upstream_completion_cost_usd, document_sources
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)`,
            [
                completion.id || null,
                requestType,
                requestedModel,
                completion.model || requestedModel,
                usage.prompt_tokens || 0,
                usage.completion_tokens || 0,
                usage.total_tokens || 0,
                promptDetails.cached_tokens || 0,
                completionDetails.reasoning_tokens || 0,
                usage.cost ?? null,
                costDetails.upstream_inference_prompt_cost ?? null,
                costDetails.upstream_inference_completions_cost ?? null,
                JSON.stringify(documentSources),
            ],
        )
    }

    static async findSummary() {
        const { rows } = await pool.query(`
            SELECT
                resolved_model AS "model",
                COUNT(*)::INTEGER AS "requestCount",
                SUM(prompt_tokens)::INTEGER AS "promptTokens",
                SUM(completion_tokens)::INTEGER AS "completionTokens",
                SUM(total_tokens)::INTEGER AS "totalTokens",
                COALESCE(SUM(cost_usd), 0)::TEXT AS "totalCostUsd",
                COALESCE(AVG(cost_usd), 0)::TEXT AS "averageCostUsd"
            FROM ai_usage_logs
            GROUP BY resolved_model
            ORDER BY SUM(cost_usd) DESC NULLS LAST, resolved_model ASC
        `)

        return rows
    }
}

export default UsageModel

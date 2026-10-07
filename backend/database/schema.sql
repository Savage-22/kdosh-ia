CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    openrouter_generation_id TEXT,
    request_type TEXT NOT NULL CHECK (request_type IN ('chat', 'rag')),
    requested_model TEXT NOT NULL,
    resolved_model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cached_tokens INTEGER NOT NULL DEFAULT 0,
    reasoning_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(18, 10),
    upstream_prompt_cost_usd NUMERIC(18, 10),
    upstream_completion_cost_usd NUMERIC(18, 10),
    document_sources JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_usage_logs
ADD COLUMN IF NOT EXISTS document_sources JSONB NOT NULL DEFAULT '[]'::JSONB;

CREATE INDEX IF NOT EXISTS ai_usage_logs_resolved_model_created_at_idx
ON ai_usage_logs (resolved_model, created_at DESC);

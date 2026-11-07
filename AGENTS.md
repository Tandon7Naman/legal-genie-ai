# AGENTS.md — Technical Rules

## Quota enforcement
- The student free-tier AI limit is enforced server-side only: every quota-covered edge function reserves a query through the `try_consume_ai_query` security-definer RPC before calling the AI gateway, and refunds it via `refund_ai_query` when the gateway call fails. Never enforce the limit or read `ai_daily_usage` counters from the client; the browser may only call `get_ai_usage_today` (read-only). Why: client-side counters are trivially bypassable.

## Edge function shared code
- Code used by two or more edge functions lives in `supabase/functions/_shared/` (e.g. `quota.ts`) and is imported relatively; per-function code stays in that function's directory. Why: functions deploy with only files under `supabase/functions/`.

## AI gateway model
- Server-side calls to the Lovable AI gateway use the model the platform setting enforces (currently `openai/gpt-6-astra` for new/changed functions; legacy functions may still carry an older model string until touched). Never pass `max_tokens`/`maxOutputTokens` to gateway calls. Why: platform policy.

## Legacy model strings
- Edge functions updated for quota/grounding work must be switched to `openai/gpt-6-astra` at the same time (see AI gateway model). Why: keep all active functions consistent with the enforced model.

## Dev-only preview warnings
- React "cannot be given refs" console warnings in the local preview come from Lovable's dev-only component tagger, not app code; they never appear on the published site. Do not chase or "fix" them in source. Why: verified 0 warnings without the tagger vs 30 with it.

## Legal source grounding
- Legal-source retrieval lives in `supabase/functions/_shared/grounding.ts` behind a provider list; functions inject `groundingContext()` into the prompt and return the `x-grounding` header so the UI can label answers "Verified sources" or "AI knowledge only". Add new sources as providers there rather than inside individual functions. Why: one swappable place, honest labelling everywhere.

-- Per-user daily AI usage ledger (server-managed; users cannot edit their own counters)
CREATE TABLE public.ai_daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  usage_date DATE NOT NULL,
  query_count INTEGER NOT NULL DEFAULT 0 CHECK (query_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

GRANT SELECT ON public.ai_daily_usage TO authenticated;
GRANT ALL ON public.ai_daily_usage TO service_role;

ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON public.ai_daily_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Atomic reserve: increments only while under the limit; returns the decision.
-- Student role derived from user_roles (server-side), never from client input.
CREATE OR REPLACE FUNCTION public.try_consume_ai_query()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
  _free_access BOOLEAN;
  _is_student BOOLEAN;
  _count INTEGER := 0;
  _limit CONSTANT INTEGER := 5;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  SELECT COALESCE(free_access, false) INTO _free_access FROM public.profiles WHERE user_id = _uid;
  _free_access := COALESCE(_free_access, false);
  _is_student := public.has_role(_uid, 'student');

  -- Only students on the free tier are limited; everyone else is unlimited.
  IF NOT _is_student OR _free_access THEN
    RETURN jsonb_build_object('allowed', true, 'unlimited', true);
  END IF;

  INSERT INTO public.ai_daily_usage (user_id, usage_date, query_count)
  VALUES (_uid, _today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET query_count = public.ai_daily_usage.query_count + 1,
                updated_at = now()
  WHERE public.ai_daily_usage.query_count < _limit;

  IF NOT FOUND THEN
    SELECT query_count INTO _count FROM public.ai_daily_usage WHERE user_id = _uid AND usage_date = _today;
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'limit', _limit);
  END IF;

  SELECT query_count INTO _count FROM public.ai_daily_usage WHERE user_id = _uid AND usage_date = _today;
  RETURN jsonb_build_object('allowed', true, 'unlimited', false, 'used', _count, 'limit', _limit, 'remaining', _limit - _count);
END;
$$;

-- Refund when the AI call itself fails, so failures never burn a query.
CREATE OR REPLACE FUNCTION public.refund_ai_query()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  UPDATE public.ai_daily_usage
  SET query_count = GREATEST(query_count - 1, 0), updated_at = now()
  WHERE user_id = _uid AND usage_date = _today AND query_count > 0;
END;
$$;

-- Read-only remaining count for UI badges (does not consume a query).
CREATE OR REPLACE FUNCTION public.get_ai_usage_today()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid UUID := auth.uid();
  _today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
  _free_access BOOLEAN;
  _is_student BOOLEAN;
  _count INTEGER := 0;
  _limit CONSTANT INTEGER := 5;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('limited', false);
  END IF;
  SELECT COALESCE(free_access, false) INTO _free_access FROM public.profiles WHERE user_id = _uid;
  _free_access := COALESCE(_free_access, false);
  _is_student := public.has_role(_uid, 'student');
  IF NOT _is_student OR _free_access THEN
    RETURN jsonb_build_object('limited', false);
  END IF;
  SELECT query_count INTO _count FROM public.ai_daily_usage WHERE user_id = _uid AND usage_date = _today;
  RETURN jsonb_build_object('limited', true, 'used', _count, 'limit', _limit, 'remaining', GREATEST(_limit - _count, 0));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.try_consume_ai_query() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refund_ai_query() FROM anon;
GRANT EXECUTE ON FUNCTION public.try_consume_ai_query() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_query() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_today() TO authenticated;

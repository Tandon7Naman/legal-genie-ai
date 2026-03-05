
-- Add free_access flag to profiles for admin override
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_access boolean NOT NULL DEFAULT false;

-- Add client_id selector support - already exists on cases table
-- Add communication_log table for client management
CREATE TABLE IF NOT EXISTS public.communication_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'note',
  subject text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own communication logs" ON public.communication_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communication logs" ON public.communication_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communication logs" ON public.communication_log
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own communication logs" ON public.communication_log
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

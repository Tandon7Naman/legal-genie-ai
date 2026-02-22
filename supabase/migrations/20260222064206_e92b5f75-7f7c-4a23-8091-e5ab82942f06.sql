
-- Create search_history table for tracking user research
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query_text TEXT NOT NULL,
  query_type TEXT NOT NULL DEFAULT 'search', -- 'search', 'analyze', 'draft'
  filters JSONB DEFAULT '{}',
  result_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own search history
CREATE POLICY "Users can view own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON public.search_history FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all search history for analytics
CREATE POLICY "Admins can view all search history"
  ON public.search_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast user lookups
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);

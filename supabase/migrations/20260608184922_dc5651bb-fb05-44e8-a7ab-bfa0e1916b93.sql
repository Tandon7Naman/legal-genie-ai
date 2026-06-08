
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS research_mode text NOT NULL DEFAULT 'professional';

CREATE TABLE public.research_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_collections TO authenticated;
GRANT ALL ON public.research_collections TO service_role;
ALTER TABLE public.research_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collections" ON public.research_collections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_research_collections_updated_at BEFORE UPDATE ON public.research_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.research_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.research_collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  source_query text,
  citations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_collection_items TO authenticated;
GRANT ALL ON public.research_collection_items TO service_role;
ALTER TABLE public.research_collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collection items" ON public.research_collection_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.research_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  title text NOT NULL,
  source_query text,
  irac jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_briefs TO authenticated;
GRANT ALL ON public.research_briefs TO service_role;
ALTER TABLE public.research_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own briefs" ON public.research_briefs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_research_briefs_updated_at BEFORE UPDATE ON public.research_briefs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.study_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_name text NOT NULL DEFAULT 'My Deck',
  question text NOT NULL,
  answer text NOT NULL,
  source_query text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_flashcards TO authenticated;
GRANT ALL ON public.study_flashcards TO service_role;
ALTER TABLE public.study_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own flashcards" ON public.study_flashcards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Tables for Recall5 AI (anonymous session-based, no auth)
CREATE TABLE public.revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  input_text TEXT,
  summary TEXT NOT NULL,
  key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  formulas JSONB NOT NULL DEFAULT '[]'::jsonb,
  rapid_fire JSONB NOT NULL DEFAULT '[]'::jsonb,
  exam_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX revisions_session_idx ON public.revisions(session_id, created_at DESC);

CREATE TABLE public.weak_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  mastery INT NOT NULL DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, topic)
);

CREATE TABLE public.streaks (
  session_id TEXT NOT NULL PRIMARY KEY,
  current_streak INT NOT NULL DEFAULT 0,
  last_active DATE,
  total_revisions INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Anonymous app: allow all reads/writes from clients. Edge function uses service role.
CREATE POLICY "public read revisions" ON public.revisions FOR SELECT USING (true);
CREATE POLICY "public insert revisions" ON public.revisions FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete revisions" ON public.revisions FOR DELETE USING (true);

CREATE POLICY "public read weak_topics" ON public.weak_topics FOR SELECT USING (true);
CREATE POLICY "public insert weak_topics" ON public.weak_topics FOR INSERT WITH CHECK (true);
CREATE POLICY "public update weak_topics" ON public.weak_topics FOR UPDATE USING (true);

CREATE POLICY "public read streaks" ON public.streaks FOR SELECT USING (true);
CREATE POLICY "public insert streaks" ON public.streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "public update streaks" ON public.streaks FOR UPDATE USING (true);

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('study-uploads', 'study-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read study-uploads" ON storage.objects FOR SELECT USING (bucket_id = 'study-uploads');
CREATE POLICY "public upload study-uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study-uploads');

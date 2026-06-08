
DROP POLICY IF EXISTS "admins read fake" ON public.fake_settings;
CREATE POLICY "anyone read fake" ON public.fake_settings
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.fake_settings TO anon;

DROP POLICY IF EXISTS "anyone read fake" ON public.fake_settings;
DROP POLICY IF EXISTS "public read fake" ON public.fake_settings;

CREATE POLICY "admins read fake_settings"
ON public.fake_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

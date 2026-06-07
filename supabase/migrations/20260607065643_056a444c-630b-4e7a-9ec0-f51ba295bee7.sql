
DROP POLICY IF EXISTS "public read active ads" ON public.ads;
CREATE POLICY "public read active ads" ON public.ads
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "admins manage user_roles" ON public.user_roles;
CREATE POLICY "admins manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "anyone can post comments" ON public.comments;
CREATE POLICY "anyone can post comments" ON public.comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(comment)) > 0
    AND length(btrim(username)) > 0
    AND length(comment) <= 2000
    AND length(username) <= 80
    AND is_fake = false
    AND status = 'approved'
    AND video_id IS NOT NULL
  );

DROP POLICY IF EXISTS "anyone insert reports" ON public.reports;
CREATE POLICY "anyone insert reports" ON public.reports
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(reason)) > 0
    AND length(reason) <= 200
    AND (details IS NULL OR length(details) <= 2000)
    AND status = 'pending'
  );

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

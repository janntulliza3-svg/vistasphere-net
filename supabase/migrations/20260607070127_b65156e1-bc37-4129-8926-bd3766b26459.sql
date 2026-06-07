
CREATE TABLE public.social_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL,
  url text NOT NULL,
  icon text NOT NULL DEFAULT 'Link',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active social links" ON public.social_links
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins manage social links" ON public.social_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.social_links (platform, url, icon, sort_order) VALUES
  ('Facebook', 'https://facebook.com', 'Facebook', 1),
  ('Twitter', 'https://twitter.com', 'Twitter', 2),
  ('Instagram', 'https://instagram.com', 'Instagram', 3),
  ('YouTube', 'https://youtube.com', 'Youtube', 4);


-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

-- Auto-grant admin to seed email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'abirkhan0175@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Videos
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text NOT NULL,
  video_url text NOT NULL,
  embed_code_backup text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  download_url text,
  download_enabled boolean NOT NULL DEFAULT false,
  popunder_url text,
  ads_enabled boolean NOT NULL DEFAULT true,
  duration text,
  views bigint NOT NULL DEFAULT 0,
  likes int NOT NULL DEFAULT 0,
  dislikes int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active videos" ON public.videos FOR SELECT USING (status='active' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage videos" ON public.videos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX videos_category_idx ON public.videos(category_id);
CREATE INDEX videos_created_idx ON public.videos(created_at DESC);
CREATE INDEX videos_views_idx ON public.videos(views DESC);

-- Comments
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  username text NOT NULL,
  comment text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  likes int NOT NULL DEFAULT 0,
  has_link boolean NOT NULL DEFAULT false,
  is_fake boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
GRANT UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read approved comments" ON public.comments FOR SELECT USING (status='approved' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone can post comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "admins manage comments" ON public.comments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Ads
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position text NOT NULL UNIQUE,
  ad_code text,
  popunder_url text,
  once_per_user boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active ads" ON public.ads FOR SELECT USING (true);
CREATE POLICY "admins manage ads" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Menus
CREATE TABLE public.menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menus TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menus TO authenticated;
GRANT ALL ON public.menus TO service_role;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "admins manage menus" ON public.menus FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Settings (singleton)
CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id=1),
  site_status boolean NOT NULL DEFAULT true,
  site_title text NOT NULL DEFAULT 'StreamBD',
  site_description text NOT NULL DEFAULT 'Professional video streaming platform',
  maintenance_title text NOT NULL DEFAULT 'We will be back soon',
  maintenance_message text NOT NULL DEFAULT 'Our team is working hard to bring StreamBD back online.',
  animation_particles boolean NOT NULL DEFAULT true,
  animation_gradient boolean NOT NULL DEFAULT true,
  animation_floating_icons boolean NOT NULL DEFAULT true,
  seo_auto_meta boolean NOT NULL DEFAULT true,
  seo_auto_sitemap boolean NOT NULL DEFAULT true,
  seo_social_preview boolean NOT NULL DEFAULT true,
  dark_mode_default boolean NOT NULL DEFAULT true,
  default_language text NOT NULL DEFAULT 'English',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "admins update settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.settings (id) VALUES (1);

-- Fake settings (singleton)
CREATE TABLE public.fake_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id=1),
  enable_fake_likes boolean NOT NULL DEFAULT true,
  like_multiplier int NOT NULL DEFAULT 5,
  random_variation boolean NOT NULL DEFAULT true,
  enable_fake_comments boolean NOT NULL DEFAULT true,
  fake_comments_per_video int NOT NULL DEFAULT 5,
  mix_ratio int NOT NULL DEFAULT 70,
  auto_star_rating boolean NOT NULL DEFAULT true,
  random_usernames boolean NOT NULL DEFAULT true,
  random_timestamps boolean NOT NULL DEFAULT true,
  templates text NOT NULL DEFAULT 'Great video!\nLoved this content\nAmazing quality\nWorth watching\nKeep it up\nBest one so far\nThanks for sharing\nReally enjoyed it',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fake_settings TO authenticated;
GRANT UPDATE ON public.fake_settings TO authenticated;
GRANT ALL ON public.fake_settings TO service_role;
ALTER TABLE public.fake_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read fake" ON public.fake_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update fake" ON public.fake_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.fake_settings (id) VALUES (1);

-- Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "admins manage reports" ON public.reports FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Increment view counter (public)
CREATE OR REPLACE FUNCTION public.increment_video_views(_video_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ UPDATE public.videos SET views = views + 1 WHERE id = _video_id $$;
GRANT EXECUTE ON FUNCTION public.increment_video_views(uuid) TO anon, authenticated;

-- Seed categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Action', 'action', 1),
  ('Drama', 'drama', 2),
  ('Comedy', 'comedy', 3),
  ('Music', 'music', 4),
  ('Sports', 'sports', 5),
  ('Documentary', 'documentary', 6);

-- Seed ads
INSERT INTO public.ads (position, is_active) VALUES
  ('header', false), ('sidebar', false), ('mid', false), ('footer', false), ('popunder', false);

-- Seed menus
INSERT INTO public.menus (name, url, icon, sort_order) VALUES
  ('Home','/','Home',1),('Trending','/trending','TrendingUp',2),('Categories','/categories','Grid',3);

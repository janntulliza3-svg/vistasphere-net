DELETE FROM public.videos a USING public.videos b
WHERE a.video_url IS NOT NULL
  AND a.video_url = b.video_url
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS videos_video_url_unique
  ON public.videos (video_url)
  WHERE video_url IS NOT NULL;
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { formatViews } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StreamBD — Watch & Stream" },
      { name: "description", content: "Stream trending videos across categories on StreamBD." },
      { property: "og:title", content: "StreamBD" },
      { property: "og:description", content: "Professional video streaming platform." },
    ],
  }),
  component: Index,
});

function Index() {
  const [featured, setFeatured] = useState<any>(null);
  const [trending, setTrending] = useState<VideoCardData[]>([]);
  const [latest, setLatest] = useState<VideoCardData[]>([]);
  const [cats, setCats] = useState<{ id: string; name: string; slug: string; image_url: string | null }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: feat }, { data: trend }, { data: lat }, { data: c }] = await Promise.all([
        supabase.from("videos").select("*").eq("status", "active").order("is_featured", { ascending: false }).order("views", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").eq("status", "active").order("views", { ascending: false }).limit(10),
        supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(12),
        supabase.from("categories").select("id,name,slug,image_url").order("sort_order").limit(8),
      ]);
      setFeatured(feat);
      setTrending(trend ?? []);
      setLatest(lat ?? []);
      setCats(c ?? []);
    })();
  }, []);

  return (
    <SiteLayout>
      {/* Hero */}
      {featured ? (
        <section className="container mx-auto px-4 pt-6">
          <Link to="/video/$id" params={{ id: featured.id }} className="group relative block rounded-2xl overflow-hidden border border-border">
            <div className="relative aspect-[21/9] bg-muted">
              <img src={featured.thumbnail_url} alt={featured.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center shadow-glow animate-pulse-play">
                  <Play className="h-10 w-10 text-primary-foreground fill-current" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 gradient-fade-b">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">{featured.title}</h1>
                <p className="text-sm text-muted-foreground">{formatViews(featured.views)} views</p>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section className="container mx-auto px-4 pt-6">
          <div className="aspect-[21/9] rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground">
            No videos yet. Add some in the admin panel.
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Trending Now</h2>
            <Link to="/trending" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {trending.map((v) => (
              <div key={v.id} className="min-w-[280px] snap-start">
                <VideoCard v={v} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {cats.length > 0 && (
        <section className="container mx-auto px-4 mt-12">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cats.slice(0, 4).map((c) => (
              <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="relative h-32 rounded-xl overflow-hidden border border-border bg-card group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/40 to-card group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold">{c.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="container mx-auto px-4 mt-12 mb-12">
        <h2 className="text-xl font-bold mb-4">Latest Videos</h2>
        {latest.length === 0 ? (
          <p className="text-muted-foreground">No videos yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latest.map((v) => <VideoCard key={v.id} v={v} />)}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

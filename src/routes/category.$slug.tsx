import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({ meta: [
    { title: `${params.slug} — StreamBD` },
    { name: "description", content: `${params.slug} category videos on StreamBD.` },
  ], links: [{ rel: "canonical", href: `/category/${params.slug}` }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<any>(null);
  const [sort, setSort] = useState<"latest"|"views"|"az">("latest");
  const [videos, setVideos] = useState<VideoCardData[]>([]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      setCat(c);
      if (!c) { setVideos([]); return; }
      let q = supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").eq("status","active").eq("category_id", c.id);
      if (sort === "latest") q = q.order("created_at", { ascending: false });
      if (sort === "views") q = q.order("views", { ascending: false });
      if (sort === "az") q = q.order("title");
      const { data } = await q.limit(60);
      setVideos(data ?? []);
    })();
  }, [slug, sort]);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {cat?.name ?? slug}
            <span className="text-sm bg-card border border-border px-2 py-0.5 rounded-full text-muted-foreground">{videos.length}</span>
          </h1>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="az">A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {videos.length === 0 ? (
          <p className="text-muted-foreground">No videos in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map(v => <VideoCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
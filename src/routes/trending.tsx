import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/trending")({
  head: () => ({ meta: [
    { title: "Trending — StreamBD" },
    { name: "description", content: "Most viewed videos on StreamBD." },
  ], links: [{ rel: "canonical", href: "/trending" }] }),
  component: TrendingPage,
});

function TrendingPage() {
  const [range, setRange] = useState<"today"|"week"|"month"|"all">("week");
  const [videos, setVideos] = useState<VideoCardData[]>([]);

  useEffect(() => {
    (async () => {
      let q = supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").eq("status","active").order("views",{ascending:false}).limit(40);
      if (range !== "all") {
        const since = new Date();
        if (range==="today") since.setDate(since.getDate()-1);
        if (range==="week") since.setDate(since.getDate()-7);
        if (range==="month") since.setDate(since.getDate()-30);
        q = q.gte("created_at", since.toISOString());
      }
      const { data } = await q;
      setVideos(data ?? []);
    })();
  }, [range]);

  const tabs: {key: typeof range; label: string}[] = [
    {key:"today",label:"Today"},{key:"week",label:"This Week"},{key:"month",label:"This Month"},{key:"all",label:"All Time"}
  ];

  return (
    <SiteLayout requireAuth>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Trending Now</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <Button key={t.key} variant={range===t.key?"default":"outline"} size="sm" onClick={() => setRange(t.key)}>{t.label}</Button>
          ))}
        </div>
        {videos.length === 0 ? (
          <p className="text-muted-foreground">No trending videos in this range.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map(v => <VideoCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/watch-later")({
  head: () => ({ meta: [{ title: "Watch Later — StreamBD" }] }),
  component: WatchLater,
});

function WatchLater() {
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const refresh = () => {
    const ids: string[] = JSON.parse(localStorage.getItem("watch_later") ?? "[]");
    if (ids.length === 0) { setVideos([]); return; }
    supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").in("id", ids).then(({data}) => setVideos(data ?? []));
  };
  useEffect(() => { refresh(); }, []);
  const remove = (id: string) => {
    const ids: string[] = JSON.parse(localStorage.getItem("watch_later") ?? "[]");
    localStorage.setItem("watch_later", JSON.stringify(ids.filter(i => i !== id)));
    refresh();
  };
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Watch Later <span className="text-sm bg-card border border-border px-2 py-0.5 rounded-full text-muted-foreground align-middle">{videos.length}</span></h1>
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Your watch later list is empty.</p>
            <Link to="/"><Button>Browse videos</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map(v => <VideoCard key={v.id} v={v} onRemove={() => remove(v.id)} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
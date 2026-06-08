import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History — StreamBD" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [videos, setVideos] = useState<VideoCardData[]>([]);
  const refresh = () => {
    const ids: string[] = JSON.parse(localStorage.getItem("history") ?? "[]");
    if (ids.length === 0) { setVideos([]); return; }
    supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").in("id", ids).then(({data}) => setVideos(data ?? []));
  };
  useEffect(() => { refresh(); }, []);
  return (
    <SiteLayout requireAuth>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Watch History</h1>
          {videos.length > 0 && (
            <Button variant="outline" onClick={() => { localStorage.removeItem("history"); refresh(); }}>Clear history</Button>
          )}
        </div>
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No watch history yet.</p>
            <Link to="/"><Button>Browse videos</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map(v => <VideoCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
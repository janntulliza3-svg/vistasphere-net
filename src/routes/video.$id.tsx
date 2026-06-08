import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, ThumbsUp, ThumbsDown, Share2, Bookmark, Download, Flag, Star } from "lucide-react";
import { formatViews, timeAgo, containsLink } from "@/lib/format";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { incrementVideoView } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/video/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Watch — StreamBD" },
      { property: "og:title", content: "Watch on StreamBD" },
      { property: "og:type", content: "video.other" },
      { property: "og:url", content: `/video/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/video/${params.id}` }],
  }),
  component: VideoPage,
});

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)} disabled={!onChange}>
          <Star className={`h-4 w-4 ${n<=value?"fill-primary text-primary":"text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function VideoPage() {
  const { id } = Route.useParams();
  const [video, setVideo] = useState<any>(null);
  const [related, setRelated] = useState<VideoCardData[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [fake, setFake] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentName, setCommentName] = useState("");
  const [commentRating, setCommentRating] = useState(5);
  const [reportReason, setReportReason] = useState("Broken Video");
  const incView = useServerFn(incrementVideoView);

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
      setVideo(v);
      if (v) {
        incView({ data: { videoId: id } }).catch(() => {});
        const hist: string[] = JSON.parse(localStorage.getItem("history") ?? "[]");
        localStorage.setItem("history", JSON.stringify([id, ...hist.filter(x=>x!==id)].slice(0,50)));
        if (v.category_id) {
          const { data: rel } = await supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").eq("status","active").eq("category_id", v.category_id).neq("id", id).limit(8);
          setRelated(rel ?? []);
        }
      }
      const { data: c } = await supabase.from("comments").select("*").eq("video_id", id).eq("status","approved").order("created_at",{ascending:false}).limit(20);
      setComments(c ?? []);
      const { data: f } = await (supabase as any).from("fake_settings").select("*").eq("id",1).maybeSingle();
      setFake(f);
    })();
  }, [id]);

  const handlePlay = () => {
    if (!video) return;
    const key = "popunder_shown";
    if (!localStorage.getItem(key) && video.popunder_url) {
      window.open(video.popunder_url, "_blank");
      localStorage.setItem(key, "1");
    }
    setShowPlayer(true);
  };

  const saveLater = () => {
    const ids: string[] = JSON.parse(localStorage.getItem("watch_later") ?? "[]");
    if (!ids.includes(id)) {
      localStorage.setItem("watch_later", JSON.stringify([id, ...ids]));
      toast.success("Added to Watch Later");
    } else toast("Already saved");
  };

  const share = (platform: "fb"|"wa"|"copy") => {
    const url = window.location.href;
    if (platform==="fb") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    if (platform==="wa") window.open(`https://wa.me/?text=${encodeURIComponent((video?.title??"")+" "+url)}`, "_blank");
    if (platform==="copy") { navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  const postComment = async () => {
    if (!commentText.trim() || !commentName.trim()) return toast.error("Name and comment required");
    const hasLink = containsLink(commentText);
    const text = hasLink ? "[Link removed by system]" : commentText.trim();
    const { error, data } = await supabase.from("comments").insert({
      video_id: id, username: commentName.trim(), comment: text, rating: commentRating, has_link: hasLink,
    }).select().single();
    if (error) return toast.error(error.message);
    setComments([data, ...comments]);
    setCommentText("");
    toast.success("Comment posted");
  };

  const submitReport = async () => {
    await supabase.from("reports").insert({ video_id: id, reason: reportReason });
    toast.success("Report submitted");
  };

  if (!video) return <SiteLayout requireAuth><div className="container mx-auto px-4 py-12 text-muted-foreground">Loading...</div></SiteLayout>;

  // Apply fake likes
  let displayLikes = video.likes ?? 0;
  if (fake?.enable_fake_likes) {
    const mult = fake.like_multiplier || 1;
    const variation = fake.random_variation ? (0.9 + ((parseInt(id.replace(/-/g,"").slice(0,8),16) % 200) / 1000)) : 1;
    displayLikes = Math.max(displayLikes, Math.floor((displayLikes || 1) * mult * variation));
  }

  // Generate fake comments mixed with real
  let displayComments = comments;
  if (fake?.enable_fake_comments) {
    const templates: string[] = (fake.templates || "").split("\n").map((s: string) => s.trim()).filter(Boolean);
    const names = ["Rakib","Sumaiya","Tanvir","Nadia","Hasan","Mim","Arif","Sadia","Imran","Farhana"];
    const seedNum = parseInt(id.replace(/-/g,"").slice(0,8), 16);
    const count = fake.fake_comments_per_video || 0;
    const fakeOnes = Array.from({ length: count }).map((_, i) => {
      const seed = seedNum + i * 137;
      const t = templates[seed % Math.max(templates.length,1)] || "Nice video!";
      const n = fake.random_usernames ? names[seed % names.length] : "Guest";
      const ago = fake.random_timestamps ? new Date(Date.now() - ((seed % 72) + 1) * 3600 * 1000).toISOString() : new Date().toISOString();
      const rating = fake.auto_star_rating ? (4 + (seed % 2)) : 5;
      return { id: `fake-${id}-${i}`, username: n, comment: t, rating, created_at: ago, has_link: false, _fake: true };
    });
    const mix = fake.mix_ratio ?? 70;
    const totalReal = comments.length;
    const keepReal = Math.max(0, Math.floor(totalReal * (100 - mix) / 100));
    displayComments = [...fakeOnes, ...comments.slice(0, keepReal || comments.length)];
  }

  return (
    <SiteLayout requireAuth>
      <div className="container mx-auto px-4 py-6">
        <nav className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link> &gt;{" "}
          <span className="text-foreground">{video.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {/* Player */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-border">
              {!showPlayer ? (
                <button onClick={handlePlay} className="absolute inset-0 group">
                  <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative h-full w-full flex flex-col items-center justify-center gap-3">
                    <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-glow animate-pulse-play">
                      <Play className="h-10 w-10 text-primary-foreground fill-current" />
                    </div>
                    <span className="text-sm text-white/90">Click to Play</span>
                  </div>
                </button>
              ) : (
                <iframe src={video.video_url} className="w-full h-full animate-fade-in" allowFullScreen frameBorder={0} />
              )}
            </div>

            <h1 className="text-2xl font-bold mt-4">{video.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2 flex-wrap">
              <span>{formatViews(video.views)} views</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>{timeAgo(video.created_at)}</span>
              <Stars value={5} />
            </div>

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button variant="outline" size="sm"><ThumbsUp className="h-4 w-4 mr-2" />{displayLikes}</Button>
              <Button variant="outline" size="sm"><ThumbsDown className="h-4 w-4 mr-2" />{video.dislikes ?? 0}</Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><Share2 className="h-4 w-4 mr-2" />Share</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Share this video</DialogTitle></DialogHeader>
                  <div className="flex gap-2">
                    <Button onClick={() => share("fb")} variant="outline">Facebook</Button>
                    <Button onClick={() => share("wa")} variant="outline">WhatsApp</Button>
                    <Button onClick={() => share("copy")}>Copy Link</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={saveLater}><Bookmark className="h-4 w-4 mr-2" />Watch Later</Button>
              {video.download_enabled && video.download_url && (
                <a href={video.download_url} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Download</Button></a>
              )}
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Flag className="h-4 w-4 mr-2" />Report</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Report video</DialogTitle></DialogHeader>
                  <Select value={reportReason} onValueChange={setReportReason}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Broken Video","Wrong Title","Spam","Copyright","Other"].map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={submitReport}>Submit report</Button>
                </DialogContent>
              </Dialog>
            </div>

            {video.description && (
              <div className="mt-6 bg-card border border-border rounded-xl p-4">
                <p className={showDesc ? "" : "line-clamp-3"}>{video.description}</p>
                <button onClick={()=>setShowDesc(s=>!s)} className="text-sm text-primary mt-2">{showDesc?"Show less":"Show more"}</button>
              </div>
            )}

            {/* Comments */}
            <section className="mt-8">
              <h2 className="text-lg font-bold mb-4">Comments ({displayComments.length})</h2>
              <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
                <input value={commentName} onChange={e=>setCommentName(e.target.value)} placeholder="Your name" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm" />
                <Textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Write a comment..." />
                <div className="flex items-center justify-between">
                  <Stars value={commentRating} onChange={setCommentRating} />
                  <Button onClick={postComment} size="sm">Post comment</Button>
                </div>
              </div>
              <div className="space-y-4">
                {displayComments.map(c => (
                  <div key={c.id} className={`flex gap-3 ${c.has_link?"opacity-70":""}`}>
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold shrink-0">
                      {c.username.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{c.username}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                        <Stars value={c.rating} />
                      </div>
                      <p className={`text-sm mt-1 ${c.has_link?"text-destructive":""}`}>{c.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar related */}
          <aside className="space-y-4">
            <h3 className="font-semibold">Related videos</h3>
            {related.map(v => <VideoCard key={v.id} v={v} />)}
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
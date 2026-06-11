import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Play, ChevronRight, ChevronLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";

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
  const [slides, setSlides] = useState<any[]>([]);
  const [trending, setTrending] = useState<VideoCardData[]>([]);
  const [latest, setLatest] = useState<VideoCardData[]>([]);
  const [latestTotal, setLatestTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const [cats, setCats] = useState<{ id: string; name: string; slug: string; image_url: string | null }[]>([]);
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const scrollTo = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  useEffect(() => {
    if (!embla) return;
    const onSel = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSel); onSel();
    const t = setInterval(() => embla.scrollNext(), 6000);
    return () => { embla.off("select", onSel); clearInterval(t); };
  }, [embla]);

  useEffect(() => {
    (async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const [{ data: slidesData }, { data: feats }, { data: trend }, { data: lat }, { data: c }] = await Promise.all([
        (supabase as any).from("hero_slides").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("videos").select("id,title,thumbnail_url,views").eq("status","active").order("is_featured",{ascending:false}).order("views",{ascending:false}).limit(5),
        supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at").eq("status", "active").order("views", { ascending: false }).limit(10),
        supabase.from("videos").select("id,title,thumbnail_url,views,duration,created_at", { count: "exact" }).eq("status", "active").order("created_at", { ascending: false }).range(from, to),
        supabase.from("categories").select("id,name,slug,image_url").order("sort_order").limit(8),
      ]);
      const s = (slidesData && slidesData.length) ? slidesData : (feats ?? []).map((v: any) => ({ id: v.id, title: v.title, subtitle: `${v.views ?? 0} views`, image_url: v.thumbnail_url, link_url: `/video/${v.id}` }));
      setSlides(s);
      setTrending(trend ?? []);
      setLatest(lat ?? []);
      setCats(c ?? []);
      const { count } = await supabase.from("videos").select("id", { count: "exact", head: true }).eq("status", "active");
      setLatestTotal(count ?? 0);
    })();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(latestTotal / PAGE_SIZE));
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const add = (n: number | "ellipsis") => pages.push(n);
    const window = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
        add(i);
      } else if (pages[pages.length - 1] !== "ellipsis") {
        add("ellipsis");
      }
    }
    return pages;
  }, [page, totalPages]);

  const goTo = (p: number) => {
    const next = Math.min(totalPages, Math.max(1, p));
    if (next !== page) {
      setPage(next);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <SiteLayout>
      {/* Hero slider */}
      {slides.length > 0 ? (
        <section className="container mx-auto px-4 pt-6">
          <div className="relative rounded-2xl overflow-hidden border border-border group">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {slides.map((s, i) => {
                  const inner = (
                    <div className="relative aspect-[21/9] bg-muted">
                      <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
                          <Play className="h-8 w-8 text-primary-foreground fill-current" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <h2 className="text-xl md:text-3xl font-bold">{s.title}</h2>
                        {s.subtitle && <p className="text-sm text-muted-foreground mt-1">{s.subtitle}</p>}
                      </div>
                    </div>
                  );
                  return (
                    <div key={s.id ?? i} className="min-w-0 flex-[0_0_100%]">
                      {s.link_url ? <a href={s.link_url}>{inner}</a> : inner}
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => embla?.scrollPrev()} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => embla?.scrollNext()} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {slides.map((_, i) => (
                <button key={i} onClick={() => scrollTo(i)} className={`h-2 rounded-full transition-all ${i===selected?"w-6 bg-primary":"w-2 bg-white/40"}`} aria-label={`Go to slide ${i+1}`} />
              ))}
            </div>
          </div>
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {latest.map((v) => <VideoCard key={v.id} v={v} />)}
            </div>
            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-1 flex-wrap" aria-label="Pagination">
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                {pageNumbers.map((p, i) =>
                  p === "ellipsis" ? (
                    <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goTo(p)}
                      aria-current={p === page ? "page" : undefined}
                      className={`min-w-10 px-3 py-2 rounded-md border text-sm transition ${
                        p === page
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  aria-label="Next page"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </SiteLayout>
  );
}

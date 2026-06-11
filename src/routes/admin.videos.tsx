import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Check, Download, Upload } from "lucide-react";
import { extractIframeSrc, slugify, formatViews, timeAgo } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/videos")({ component: VideosAdmin });

function VideosAdmin() {
  const [videos, setVideos] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blank());
  const [embedInput, setEmbedInput] = useState("");
  const [newCat, setNewCat] = useState("");

  function blank() { return { title:"", thumbnail_url:"", video_url:"", category_id:null, download_url:"", download_enabled:false, popunder_url:"", ads_enabled:true, description:"" }; }

  const load = async () => {
    const [{ data: v }, { data: c }] = await Promise.all([
      supabase.from("videos").select("*, categories(name)").order("created_at",{ascending:false}),
      supabase.from("categories").select("*").order("name"),
    ]);
    setVideos(v ?? []); setCats(c ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(blank()); setEmbedInput(""); setOpen(true); };
  const openEdit = (v: any) => { setEditing(v); setForm({ ...v }); setEmbedInput(v.video_url); setOpen(true); };

  const detectedUrl = extractIframeSrc(embedInput);

  const save = async () => {
    if (!form.title || !form.thumbnail_url || !detectedUrl) return toast.error("Title, thumbnail, and a valid embed are required");
    const payload = { ...form, video_url: detectedUrl, embed_code_backup: embedInput };
    delete payload.categories;
    if (!editing) {
      const { data: dup } = await supabase.from("videos").select("id").eq("video_url", detectedUrl).maybeSingle();
      if (dup) return toast.error("Duplicate: this video is already posted");
    }
    if (editing) {
      const { data, error } = await supabase.from("videos").update(payload).eq("id", editing.id).select("*, categories(name)").single();
      if (error) return toast.error(error.message);
      setVideos(prev => prev.map(v => v.id === editing.id ? data : v));
      toast.success("Video updated");
    } else {
      const { data, error } = await supabase.from("videos").insert(payload).select("*, categories(name)").single();
      if (error) {
        if ((error as any).code === "23505") return toast.error("Duplicate: this video is already posted");
        return toast.error(error.message);
      }
      setVideos(prev => [data, ...prev]);
      toast.success("Video added");
    }
    setOpen(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    setVideos(prev => prev.filter(v => v.id !== id));
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("Deleted");
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const slug = slugify(newCat);
    const { data, error } = await supabase.from("categories").insert({ name: newCat.trim(), slug }).select().single();
    if (error) return toast.error(error.message);
    setCats([...cats, data]); setForm({ ...form, category_id: data.id }); setNewCat("");
    toast.success("Category added");
  };

  const exportJson = () => {
    const rows = videos.map(({ categories, ...v }) => ({ ...v, category_name: categories?.name ?? null }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `videos-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} videos`);
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (!arr.length) return toast.error("Empty JSON");
      const catByName = new Map(cats.map(c => [c.name.toLowerCase(), c.id]));
      const ALLOWED = ["title","description","thumbnail_url","video_url","embed_code_backup","category_id","download_url","download_enabled","popunder_url","ads_enabled","duration","views","likes","dislikes","status","is_featured"];
      let fail = 0;
      let dupes = 0;
      let firstError = "";
      const prepared: any[] = [];
      const toastId = toast.loading(`Preparing ${arr.length} rows...`);
      // Pre-load existing video_urls for fast dedupe
      const { data: existingRows } = await supabase.from("videos").select("video_url");
      const existingUrls = new Set((existingRows ?? []).map((r: any) => r.video_url).filter(Boolean));
      const seenInBatch = new Set<string>();
      for (const raw of arr) {
        const src: any = { ...raw };
        // alias common field names from other CMS exports
        if (!src.thumbnail_url) src.thumbnail_url = src.thumbnail ?? src.poster ?? src.image ?? src.poster_url ?? src.slider_image ?? "";
        if (!src.embed_code_backup) src.embed_code_backup = src.embed_code ?? src.embed ?? src.iframe ?? "";
        if (!src.duration) src.duration = src.quality ?? src.duration_text ?? undefined;
        if (src.views === undefined) src.views = src.fake_views ?? src.view_count ?? src.clicks ?? undefined;
        if (typeof src.is_featured === "string") src.is_featured = src.is_featured === "true" || src.is_featured === "1";
        if (typeof src.status !== "string" || !src.status) src.status = "active";
        // resolve category by name if provided
        let categoryId: string | null = (typeof src.category_id === "string" && /^[0-9a-f-]{36}$/i.test(src.category_id)) ? src.category_id : null;
        const catName = src.category_name ?? src.category ?? src.categories?.name ?? null;
        if (!categoryId && catName) {
          const key = String(catName).toLowerCase();
          let cid = catByName.get(key);
          if (!cid) {
            const slug = slugify(catName);
            const { data: nc } = await supabase.from("categories").insert({ name: catName, slug }).select().single();
            if (nc) { cid = nc.id; catByName.set(key, cid); setCats(prev => [...prev, nc]); }
          }
          categoryId = cid ?? null;
        }
        // detect embed from common fields
        const embedRaw = src.embed_code_backup ?? src.embed ?? src.iframe ?? src.video_url ?? "";
        const detected = extractIframeSrc(embedRaw) || src.video_url || "";
        const r: any = {};
        for (const k of ALLOWED) if (src[k] !== undefined && src[k] !== null) r[k] = src[k];
        r.category_id = categoryId;
        if (detected) r.video_url = detected;
        if (embedRaw && !r.embed_code_backup) r.embed_code_backup = String(embedRaw);
        if (!r.title || !r.thumbnail_url || !r.video_url) {
          fail++;
          if (!firstError) firstError = `Missing required field. Got title=${!!r.title}, thumbnail_url=${!!r.thumbnail_url}, video_url=${!!r.video_url}`;
          continue;
        }
        if (existingUrls.has(r.video_url) || seenInBatch.has(r.video_url)) {
          dupes++;
          continue;
        }
        seenInBatch.add(r.video_url);
        prepared.push(r);
      }
      // Batch insert in chunks of 100
      let ok = 0;
      const inserted: any[] = [];
      const CHUNK = 100;
      for (let i = 0; i < prepared.length; i += CHUNK) {
        const chunk = prepared.slice(i, i + CHUNK);
        toast.loading(`Inserting ${i + 1}-${Math.min(i + CHUNK, prepared.length)} of ${prepared.length}...`, { id: toastId });
        const { data, error } = await supabase.from("videos").insert(chunk).select("*, categories(name)");
        if (error) {
          if (!firstError) firstError = error.message;
          // fallback: insert one by one to salvage what we can
          for (const row of chunk) {
            const { data: d2, error: e2 } = await supabase.from("videos").insert(row).select("*, categories(name)").single();
            if (e2) {
              if ((e2 as any).code === "23505") dupes++;
              else { fail++; if (!firstError) firstError = e2.message; }
            }
            else { ok++; inserted.push(d2); }
          }
        } else {
          ok += data?.length ?? 0;
          if (data) inserted.push(...data);
        }
      }
      if (inserted.length) setVideos(prev => [...inserted, ...prev]);
      toast.dismiss(toastId);
      const dupMsg = dupes ? `, skipped ${dupes} duplicate${dupes>1?"s":""}` : "";
      if (ok && !fail) toast.success(`Imported ${ok} videos${dupMsg}`);
      else if (ok) toast.warning(`Imported ${ok}${dupMsg}, ${fail} failed. First error: ${firstError}`);
      else if (dupes && !fail) toast.warning(`Nothing imported — all ${dupes} were duplicates`);
      else toast.error(`All ${fail} failed${dupMsg}. First error: ${firstError}`);
    } catch (e: any) {
      toast.error("Invalid JSON file: " + (e?.message ?? ""));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Videos</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportJson}><Download className="h-4 w-4 mr-2" />Export JSON</Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />Import JSON
              <input type="file" accept="application/json,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
            </label>
          </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Video</Button></SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader><SheetTitle>{editing?"Edit Video":"Add Video"}</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
              <div><Label>Thumbnail URL *</Label><Input value={form.thumbnail_url} onChange={e=>setForm({...form,thumbnail_url:e.target.value})} />
                {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="mt-2 rounded-md max-h-32" />}
              </div>
              <div>
                <Label>Video Embed Code *</Label>
                <Textarea value={embedInput} onChange={e=>setEmbedInput(e.target.value)} placeholder="Paste iframe code or URL..." className="font-mono text-xs" />
                {detectedUrl && <p className="text-xs text-success mt-2 flex items-center gap-1"><Check className="h-3 w-3" /> Detected: {detectedUrl}</p>}
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category_id ?? ""} onValueChange={v=>setForm({...form, category_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {cats.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="New category name" value={newCat} onChange={e=>setNewCat(e.target.value)} className="text-xs" />
                  <Button type="button" size="sm" variant="outline" onClick={addCategory}>Add</Button>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={e=>setForm({...form,description:e.target.value})} /></div>
              <div><Label>Download URL</Label><Input value={form.download_url ?? ""} onChange={e=>setForm({...form,download_url:e.target.value})} /></div>
              <div className="flex items-center justify-between"><Label>Enable download</Label><Switch checked={!!form.download_enabled} onCheckedChange={v=>setForm({...form,download_enabled:v})} /></div>
              <div><Label>Popunder URL</Label><Input value={form.popunder_url ?? ""} onChange={e=>setForm({...form,popunder_url:e.target.value})} /></div>
              <div className="flex items-center justify-between"><Label>Enable ads</Label><Switch checked={!!form.ads_enabled} onCheckedChange={v=>setForm({...form,ads_enabled:v})} /></div>
              <div className="flex gap-2 pt-4">
                <Button onClick={save} className="flex-1">{editing?"Update":"Save"}</Button>
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left p-3">Video</th><th className="text-left p-3">Category</th><th className="text-left p-3">Views</th><th className="text-left p-3">Status</th><th className="text-left p-3">Created</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {videos.map(v => (
              <tr key={v.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 flex items-center gap-3">
                  <img src={v.thumbnail_url} alt="" className="h-10 w-16 object-cover rounded" />
                  <span className="line-clamp-1">{v.title}</span>
                </td>
                <td className="p-3 text-muted-foreground">{v.categories?.name ?? "—"}</td>
                <td className="p-3">{formatViews(v.views)}</td>
                <td className="p-3"><span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${v.status==="active"?"bg-success":"bg-muted-foreground"}`} />{v.status}</span></td>
                <td className="p-3 text-muted-foreground">{timeAgo(v.created_at)}</td>
                <td className="p-3 text-right">
                  <Button size="icon" variant="ghost" onClick={()=>openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={()=>remove(v.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {videos.length===0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No videos yet. Click Add Video.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
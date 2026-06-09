import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Computes display-only engagement (likes + comments) server-side using
// the internal fake_settings table without exposing those settings to clients.
export const getVideoEngagement = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ videoId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = data.videoId;

    const [{ data: video }, { data: realComments }, { data: fake }] = await Promise.all([
      supabaseAdmin.from("videos").select("likes").eq("id", id).maybeSingle(),
      supabaseAdmin
        .from("comments")
        .select("*")
        .eq("video_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("fake_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    const baseLikes = video?.likes ?? 0;
    let displayLikes = baseLikes;
    if (fake?.enable_fake_likes) {
      const mult = fake.like_multiplier || 1;
      const variation = fake.random_variation
        ? 0.9 + ((parseInt(id.replace(/-/g, "").slice(0, 8), 16) % 200) / 1000)
        : 1;
      displayLikes = Math.max(baseLikes, Math.floor((baseLikes || 1) * mult * variation));
    }

    const comments = realComments ?? [];
    let displayComments: any[] = comments;
    if (fake?.enable_fake_comments) {
      const templates: string[] = (fake.templates || "")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const names = ["Rakib","Sumaiya","Tanvir","Nadia","Hasan","Mim","Arif","Sadia","Imran","Farhana"];
      const seedNum = parseInt(id.replace(/-/g, "").slice(0, 8), 16);
      const count = fake.fake_comments_per_video || 0;
      const fakeOnes = Array.from({ length: count }).map((_, i) => {
        const seed = seedNum + i * 137;
        const t = templates[seed % Math.max(templates.length, 1)] || "Nice video!";
        const n = fake.random_usernames ? names[seed % names.length] : "Guest";
        const ago = fake.random_timestamps
          ? new Date(Date.now() - ((seed % 72) + 1) * 3600 * 1000).toISOString()
          : new Date().toISOString();
        const rating = fake.auto_star_rating ? 4 + (seed % 2) : 5;
        return { id: `fake-${id}-${i}`, username: n, comment: t, rating, created_at: ago, has_link: false, _fake: true };
      });
      const mix = fake.mix_ratio ?? 70;
      const totalReal = comments.length;
      const keepReal = Math.max(0, Math.floor(totalReal * (100 - mix) / 100));
      displayComments = [...fakeOnes, ...comments.slice(0, keepReal || comments.length)];
    }

    return { displayLikes, displayComments };
  });
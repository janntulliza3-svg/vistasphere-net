# StreamBD v2 — Full Update Plan

## 1. Database (single migration)

**New tables**
- `profiles` — `user_id` (PK, FK auth.users), `username`, `display_name`, `avatar_url`, `plan` (`free`|`paid`), `plan_expires_at`, `status` (`active`|`banned`|`restricted`), timestamps
- `subscription_plans` — `id`, `name`, `duration_months`, `price`, `is_active`, `sort_order` (seed: 1m / 3m / 12m)
- `hero_slides` — `id`, `title`, `subtitle`, `image_url`, `video_id`, `link_url`, `sort_order`, `is_active`

**Alter**
- `settings`: add `favicon_url`, `telegram_bot_username` (default `vipdesi_bot`)
- `videos`: add `dislikes` int default 0
- Trigger `handle_new_user` also inserts a `profiles` row

**RLS**
- profiles: user reads/updates own; admin manages all
- subscription_plans: public read active; admin manages all
- hero_slides: public read active; admin manages all
- Standard GRANTs to authenticated / service_role / anon (where public read)

## 2. Auth gating
- Create integration-managed `src/routes/_authenticated/route.tsx` (`ssr:false`, redirect → `/auth`)
- Move protected routes under `_authenticated/`: `categories`, `category.$slug`, `trending`, `search`, `video.$id`, `history`, `watch-later`, `profile`, all `admin.*`
- Keep public: `/` (home), `/auth`
- Update internal `<Link>` paths after moves

## 3. Profile page (`/_authenticated/profile`)
- Card with avatar, username (editable), email (readonly), plan badge
  - Paid → gold ring + "Gold Member" with expiry date
  - Free → neutral border + "Free"
- Password change form (`supabase.auth.updateUser`)
- Subscription section: 3 gold gradient buttons (1 / 3 / 12 months) with live prices from `subscription_plans`
- Click → modal with plan name + price + Buy button
- Buy → opens `https://t.me/{bot_username}?text=<urlencoded message>` in new tab

## 4. Admin updates
- **`/admin/users`** — list profiles + auth metadata via server fn (admin client), actions: change status (active / banned / restricted), set plan (free/paid + expiry), delete, add (invite by email/password)
- **`/admin/reports`** — list `reports` joined with video + commenter; mark resolved/dismiss
- **`/admin/subscriptions`** — CRUD `subscription_plans` (price/duration/active)
- **`/admin/slider`** — CRUD `hero_slides`
- Admin sidebar gets new links

## 5. Site settings
- Settings page: site title, description, favicon upload (storage bucket `branding` public), telegram bot username
- Root layout: fetch settings once, set `<title>` + `<link rel=icon>` dynamically + default OG tags
- All hardcoded "StreamBD" strings switch to settings value

## 6. Homepage slider
- Replace single featured hero with a carousel (embla `useEmblaCarousel` already shipped or add `embla-carousel-react`)
- Source: `hero_slides` where `is_active`, ordered by `sort_order`; fallback to top featured videos
- Auto-advance every 6s, dots + arrows

## 7. Fakes + view count
- **Fake likes**: when `enable_fake_likes`, multiply real `likes` by `like_multiplier` (±10% if `random_variation`) at display time in `video.$id`
- **Fake comments**: when `enable_fake_comments`, generate N comments per video from `templates` mixed with real per `mix_ratio` on the video page (client-side, deterministic by video id seed)
- **View count fix**: ensure `increment_video_views` RPC is called on video page mount (and not blocked) — switch to a small `incrementView` server fn using admin client to bypass RLS reliably

## 8. Telegram deep link helper
- `src/lib/telegram.ts` → `buyPlanLink(planName, price, botUsername)` returns `https://t.me/{bot}?text=...` with the Bangla template:
  ```
  হ্যালো এডমিন, আমি আমার অ্যাকাউন্টটি একটিভ করতে চাই।
  প্ল্যান: {name}
  দাম: {price}
  আমি কিভাবে টাকা পাঠাবো দয়া করে জানাবেন।
  ```

## 9. Header tweaks
- Show profile avatar + plan badge in header when signed in
- "Sign in" button when signed out
- Subscription gold CTA in header (links to `/profile#subscribe`) when free user

## Out of scope (would balloon size)
- Real payment processing (Telegram manual flow as requested)
- Email invites (admin "add user" uses admin API to create with temp password)
- Realtime user presence

## Execution order
1. Migration (approval required)
2. Storage bucket `branding` (after migration)
3. Auth layout + route moves
4. Profile + subscription UI + telegram helper
5. Admin: users, reports, subscriptions, slider, settings (favicon)
6. Dynamic title/favicon in root
7. Homepage slider
8. Fakes + view count fixes
9. Header polish

Each step verified against build/preview before moving on.

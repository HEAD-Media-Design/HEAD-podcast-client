# Moving to podcasts.mastermediadesign.ch — checklist

Everything to do when the site moves from `head-podcast-client.vercel.app` to
`podcasts.mastermediadesign.ch`, in order: DNS, Vercel, the site URL, audio hosting, link previews and
search, the old-domain redirect, and a final check on real phones.

## Current state (2026-10-08)

| Item | State |
|---|---|
| Site hosting | Vercel; pushing to `main` deploys to production |
| New domain | Added in Vercel, **Invalid Configuration** (no DNS record yet) |
| `mastermediadesign.ch` DNS | **Infomaniak** (`ns11/ns12.infomaniak.ch`), managed by the TA |
| DNS record needed | `CNAME podcasts → 7e9a71f0310a63bf.vercel-dns-017.com.` |
| Site URL (`VITE_SITE_URL`) | `https://head-podcast-client.vercel.app` |
| Audio | Cloudflare R2 development URL `https://pub-c59c577167cb4a0a8e18246fc4491223.r2.dev/podcast/…` |

---

## 0. Right now

- [ ] **Turn off the `head-podcast-client.vercel.app` redirect.** Vercel → Settings → Domains →
  `head-podcast-client.vercel.app` → Edit → **No Redirect**.
  - It currently sends visitors (307) to the new domain, which doesn't resolve yet, so the existing
    link doesn't open the site.
  - Turn it back on in step 6.

## 1. Add the DNS record (TA)

- [ ] Ask the TA to add:

  | Type | Name | Value | TTL |
  |---|---|---|---|
  | CNAME | `podcasts` | `7e9a71f0310a63bf.vercel-dns-017.com.` | 3600 (or the default) |

  If the DNS panel rejects the trailing `.`, enter the value without it.
- [ ] Check it's live (prints the value once it is):

  ```bash
  dig +short podcasts.mastermediadesign.ch CNAME
  ```

## 2. Confirm the domain in Vercel

- [ ] Vercel → Domains: `podcasts.mastermediadesign.ch` shows **Valid Configuration** (press **Refresh**
  if it doesn't update).
- [ ] HTTPS works. Vercel issues the certificate automatically.

  ```bash
  curl -sI https://podcasts.mastermediadesign.ch | head -1   # expect HTTP/2 200
  ```

## 3. Change the site URL and redeploy

`VITE_SITE_URL` is written in **at build time** into `index.html` (canonical, Open Graph/Twitter
preview tags, JSON-LD), `podcast.rss`, `sitemap.xml` and `robots.txt`. A redeploy is required after
changing it.

- [ ] Vercel → Settings → Environment Variables: set `VITE_SITE_URL` to
  `https://podcasts.mastermediadesign.ch` for **both Production and Preview**, with no trailing `/`.
- [ ] Update the fallback in the repo too:
  - `.env`: `VITE_SITE_URL=https://podcasts.mastermediadesign.ch`
  - Run `npm run validate:episodes` to regenerate `public/podcast.rss`, `public/sitemap.xml` and
    `public/robots.txt` with the new URL.
  - Commit and push to `main` (this deploys).
- [ ] Check the deployed output uses the new URL. `head-podcast-client` must not appear anywhere.

  ```bash
  curl -s https://podcasts.mastermediadesign.ch/ | grep -o 'content="https://[^"]*"' | sort -u
  curl -s https://podcasts.mastermediadesign.ch/podcast.rss | grep -c head-podcast-client   # expect 0
  curl -s https://podcasts.mastermediadesign.ch/sitemap.xml | head -5
  curl -s https://podcasts.mastermediadesign.ch/robots.txt
  curl -sI https://podcasts.mastermediadesign.ch/og-image.jpg | head -1
  ```

## 4. Audio hosting

### Why change it

- The `pub-….r2.dev` URL is Cloudflare's **development** URL. It is rate-limited and doesn't go through
  Cloudflare's cache, so it's the first thing that will slow down or stall when more people listen at
  once.
- The usual fix is to attach your own domain (e.g. `audio.mastermediadesign.ch`) to the R2 bucket.
  That requires the domain's DNS to be **managed by Cloudflare**. `mastermediadesign.ch` is on
  Infomaniak, so that isn't possible as things stand.

### Options

| | Approach | Pros | Cons |
|---|---|---|---|
| A | **Serve the audio from the Vercel site** (`public/audio/…` → `podcasts.mastermediadesign.ch/audio/…`) | No extra DNS work. Uses Vercel's CDN and cache. Same origin as the site, so the audio-reactive visual reacts to the **actual sound** (today it only simulates it, because browsers block reading cross-origin audio). | Adds ~78 MB of MP3s to the repo. Uses the Vercel plan's bandwidth (see capacity below). |
| B | **Put a CDN in front of R2** (e.g. Bunny CDN with R2 as origin) + ask the TA for `CNAME audio → CDN host` | Keeps R2; works with Infomaniak DNS. Fast and cached. | One more service to pay for (small amount) and maintain. |
| C | **Move `mastermediadesign.ch` DNS to Cloudflare**, then attach `audio.` to R2 | The standard Cloudflare-only setup. | Means moving the whole school domain's DNS; unlikely to be practical. |
| D | Keep `r2.dev` | Nothing to do. | The rate-limit and caching problems remain. |

Recommendation: with 10 episodes (~78 MB), **A** is the simplest and most effective. Revisit B if
traffic grows well beyond the capacity below.

- [ ] Decide: A / B / C / D

### Capacity of option A on the Vercel Hobby (free) plan

Source: [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) and [Limits](https://vercel.com/docs/limits)
(docs updated September 2026). Check them again before relying on these numbers.

| Hobby allotment (per month) | Amount |
|---|---|
| Fast Data Transfer (bandwidth to visitors) | 100 GB |
| CDN requests | 1,000,000 |
| Fast Origin Transfer | 10 GB |
| Over the limit | The feature is **paused for up to 30 days** (no overage billing on Hobby) |

**Simultaneous listeners are not the limit.** Static files are served from Vercel's CDN with no
concurrency cap; one stream is only 192 kbps (24 KB/s). The limit is the **monthly bandwidth total**.

| What it costs | Vercel bandwidth |
|---|---|
| One page visit (JS, CSS, font, images) | ~0.5 MB |
| One hour of listening | ~86 MB |
| One full episode (average 7.85 MB) + visit | ~8.4 MB |

| Monthly budget of 100 GB ≈ | |
|---|---|
| Listening hours | **~1,150 hours** |
| Visitors who play one full episode | ~12,000 (~400 a day) |
| Visitors who play all 10 episodes | ~1,250 |
| A 1-hour session with 100 people listening at once | ~8.6 GB (about 9% of the month) |
| CDN requests | ~30 per visit, so ~33,000 visits before the 1,000,000 limit (bandwidth runs out first) |

Things to check before choosing A:

- [ ] **Which plan the project is on.** Vercel's limits page says Hobby can't connect a project to a
  Git repository owned by a Git **organization**, and this repo belongs to `HEAD-Media-Design`. Check
  Vercel → Settings → Billing to see whether the project is on Hobby, a Pro trial, or Pro.
- [ ] **Hobby is for non-commercial, personal use only** (Vercel fair-use guidelines). Confirm that fits
  a school project, or use a Pro/education plan.
- [ ] **CLI deploys are capped at 100 MB of source files on Hobby.** Git deploys aren't affected, but if
  anyone deploys with `vercel --prod` from a laptop, ~78 MB of audio leaves little headroom.
- [ ] Turn on **usage alerts** (Settings → Billing / Usage) so the team hears before the 100 GB runs out.

### After choosing (all options)

- [ ] **Tidy the R2 file name.** The Google episode was uploaded as
  `podcast:Supernova_Google_s_targeted_ads_and_privacy_Haneul_c86327c1ef.mp3`, with a `podcast:`
  prefix. Rename it without the prefix (with option A, just drop the prefix when moving it).
- [ ] **Back up the originals.** The two WAV masters (`*.wav`) still on R2 are no longer used by the site;
  back them up and delete them if you like.
- [ ] **Update `audioUrl` in all 10 episode files** (`content/episodes/*.json`).
- [ ] **Update the audio `preconnect` in `index.html`.** With option A the audio is same-origin, so remove
  that line.
- [ ] **Regenerate the RSS feed** with `npm run validate:episodes` (updates each `<enclosure>` URL).
- [ ] **(Option A) Cache header.** In `vercel.json` → `headers`, add `/audio/(.*)` →
  `Cache-Control: public, max-age=31536000, immutable`. Only safe if a changed recording always gets a
  new file name.
- [ ] **(Option A) File size.** Each file must stay under GitHub's 100 MB limit; the largest is
  currently 10.6 MB.
- [ ] **Every audio URL returns 200 / `audio/mpeg` and supports range requests:**

  ```bash
  for u in $(grep -ho '"audioUrl": "[^"]*' content/episodes/*.json | cut -d'"' -f4); do
    curl -s -o /dev/null -w "%{http_code} %{content_type} " -I "$u"
    curl -s -o /dev/null -w "range=%{http_code}  $u\n" -H "Range: bytes=0-1" "$u"   # expect range=206
  done
  ```

## 5. Link previews and search

- [ ] **WhatsApp:** send `https://podcasts.mastermediadesign.ch` and check the title, description and
  image appear. WhatsApp caches failed previews, so add `?v=1` the first time.
- [ ] **Episode links:** check a preview for e.g. `/episode/the-best-photo` too.
- [ ] **[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/):** run "Scrape Again"
  on the new URL (WhatsApp uses the same data).
- [ ] **Google Search Console:** add `podcasts.mastermediadesign.ch` as a new property, verify it, and
  submit `https://podcasts.mastermediadesign.ch/sitemap.xml`.
- [ ] **Podcast apps:** if the feed (`/podcast.rss`) was submitted to Apple Podcasts, Spotify, etc.,
  update the feed URL there.

## 6. Turn the old-domain redirect back on

Only **after** the new domain is fully working.

- [ ] Vercel → Domains → `head-podcast-client.vercel.app` → Edit → redirect to
  `podcasts.mastermediadesign.ch`. It's a permanent move, so use **308 (Permanent)**.
- [ ] Old episode links land on the same episode on the new domain:

  ```bash
  curl -sI https://head-podcast-client.vercel.app/episode/the-best-photo | grep -i '^location'
  ```

- [ ] Don't remove the `head-podcast-client.vercel.app` domain: links already shared and RSS
  subscribers still use it.

## 7. Final check on real phones

On the deployed new domain, on real devices.

| Device / browser | First load | Play | Swipe to next | Quick repeated swipes | Lock screen, then return |
|---|---|---|---|---|---|
| iPhone Safari | [ ] | [ ] | [ ] | [ ] | [ ] |
| iPhone, WhatsApp in-app browser | [ ] | [ ] | [ ] | [ ] | [ ] |
| Android Chrome | [ ] | [ ] | [ ] | [ ] | [ ] |

- [ ] No error banners such as "Media failed to decode".
- [ ] Sound starts within about a second of switching episodes.
- [ ] After locking the phone or switching apps and coming back, the canvas isn't stuck on the "sad face"
  broken-graphics icon.
- [ ] All 10 episodes play through (at least skip to the middle and near the end of each).

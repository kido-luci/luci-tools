# luci-tools — Common Plan (shared spec, rationale & roadmap)

Companion to [../CLAUDE.md](../CLAUDE.md). CLAUDE.md is the operative ruleset loaded
every session; this file holds the **why** behind each rule, the infra design, the
full tool catalog, and the build order.

---

## 1. Vision & economics

A portfolio of small, single-purpose web tools that each rank for one search intent
and earn ad revenue. The model only works because the tools are **100% client-side**:

- The user uploads a file, **their browser** does the work (Canvas / WASM), nothing
  hits a server → **$0 marginal cost per user, 100% margin**.
- Hosting is free (Cloudflare Pages). The only real costs are time and possibly a
  $5/mo Cloudflare Worker plan if traffic outgrows the free tier.

**Revenue = traffic × RPM.** Being free to host is the easy part. The hard parts,
in order, are:
1. **Traffic** — earned through SEO. No traffic, no revenue. The whole architecture
   below is optimized for this.
2. **AdSense approval** — needs real content, legal pages, and some traffic/age.
3. **RPM** — VN traffic ≈ $0.5–3; US/Western ≈ $10–30. English-language tools
   (image, PDF, dev) pull global traffic and earn multiples of VN-only calculators.

**Maintenance discipline:** prefer tools whose correctness never changes (math,
stable file formats, frozen standards). Explicitly avoid law-dependent calculators
(income tax, social insurance, minimum wage) — they need yearly upkeep and go stale
silently. Loan/interest math is fine: the rate is a user input, the formula is fixed.

## 2. Decision log (what we chose and why)

### Domain: `tools.luci-studio.com` + routing Worker  *(chosen over 3 alternatives)*

| Option | Verdict |
|---|---|
| Per-engine subdomain (`imageconvert.luci-studio.com`) | Rejected. Each subdomain is an SEO island building authority from ~0, no cross-pollination; multiplies ads.txt / AdSense site / consent / legal setup per tool. |
| **One host, path-based (`tools.luci-studio.com/...`)** | **Chosen.** Pools authority across all tools; one ads.txt / AdSense site / consent / legal set. **Still keeps separate repos** — the Worker only routes; each repo deploys independently. Cost: one small Worker (SPOF, possible $5/mo at scale). |
| Subdirectory on root (`luci-studio.com/tools/...`) | Rejected. Best raw SEO (inherits blog authority) but the router would sit in front of the live blog (risk) and conflicts with separate repos. |
| Separate root domains (`imageconvert.com`) | Deferred. Best for branding/selling a winner; costs $/domain and starts from 0. Use later via 301 to graduate a successful tool. |

Authority consolidation is the dominant factor for ad revenue, and the big
converter sites all run on a single domain for exactly this reason. The escape
hatch: nothing is permanent — a winning tool can later 301 to its own domain
(passes most authority).

### Path scheme: engine-prefix (`/image/heic-to-jpg`)  *(over flat `/heic-to-jpg`)*

Flat keyword paths are marginally cleaner but force a central keyword→repo registry
in the Worker (every new page edits the Worker) and risk slug collisions.
Engine-prefix makes the Worker trivial (first segment = project), lets each repo own
its namespace with zero central coupling, and gives free category hub pages
(`/image/`, `/pdf/`) which are good for SEO. The extra path segment is a negligible
ranking factor. Each repo sets Astro `base: '/<engine>'` so its **links, canonical
tags and sitemap** already use the production path.

> **Correction (learned on first deploy):** `base` does **not** nest the build
> output — the dist serves at the origin *root* (`/heic-to-jpg/`, not
> `/image/heic-to-jpg/`). So the Worker is **not** a pure pass-through: it strips the
> `/<engine>` prefix when proxying and re-adds it on redirect `Location` headers
> (see §3). Also, `<engine>.pages.dev` names are globally unique, so the deployed
> origins carry a random suffix (e.g. `image-converter-69t.pages.dev`).

### Other locked choices
- **Separate repos** (the deploy/isolation model is **not** a monorepo and **not**
  submodule-coupled): isolation, independent deploy, each tool can graduate/sell
  separately. The SEO cost of separation is recovered by the single-host routing
  above.
  - *Management layer (added):* a thin meta-repo **`kido-luci/luci-tools`** (private)
    aggregates every tool repo as **git submodules** purely for convenience —
    one-command clone, backup, and versioning the shared `CLAUDE.md` + `docs/` +
    `.claude/launch.json`. This does **not** change the above: each tool stays an
    independent repo and Cloudflare Pages deploys it directly from its own `master`;
    the submodule pointer never touches deployment.
  - *Superseded (2026-07-31):* the tool repos were consolidated into
    **`kido-luci/luci-tools`** as one monorepo, each subtree-merged in with full
    history as a top-level directory, and the per-engine repos were then deleted.
    The repo is now public (AGPL-3.0). Isolation and independent deploys hold per
    directory instead: one Pages project and one path prefix per engine, each
    deployed on its own (see [../CLAUDE.md](../CLAUDE.md) and [deploy.md](deploy.md)).
- **Astro static**: SSG = strong SEO + one repo → many landing pages via file
  routing + $0 server. Matches existing skill. No Sentry / no SSR adapter keeps the
  dev server working.
- **AdSense** to start; graduate to Ezoic → Mediavine (≥50k sessions/mo) →
  AdThrive as traffic grows (2–4× RPM).
- **Cloudflare Web Analytics** (free, privacy-friendly, auto-inject) over GA4 for
  consistency with the blog.

## 3. Infrastructure design

### `tools-router` (Cloudflare Worker)
Pure reverse proxy. Bound to `tools.luci-studio.com/*`. Logic:
- Read `url.pathname`. First segment selects the origin Pages project:
  `image → image-converter.pages.dev`, `pdf → pdf-tools.pages.dev`, …
- No prefix (`/`, `/privacy`, `/ads.txt`, `/sitemap.xml`, `/robots.txt`) → `tools-home`.
- `fetch()` the same path on the chosen origin and return it (pass-through; because
  each repo uses `base: '/<engine>'`, the path already matches — no rewriting).
- Keep the project map as a small constant object. Adding an engine = one line.
- Watch the Worker free tier (100k req/day); move to Workers Paid ($5/mo) only when
  traffic justifies it.

> **Status — DEPLOYED (live).** `tools-router/` proxies `tools.luci-studio.com`
> (Worker custom domain) to the origin Pages projects. First deploy surfaced two
> gotchas, now handled in `src/index.ts` (`resolveRoute` / `rewriteLocation`,
> unit-tested 9/9): (a) `<engine>.pages.dev` is globally unique, so the real origins
> carry a suffix — hardcoded in `ORIGINS`; (b) Astro `base` does not nest dist, so
> the Worker strips the `/<engine>` prefix and re-adds it on redirects. ⚠️ The
> suffixed origin hosts change if a Pages project is deleted/recreated — a stable
> upgrade is per-project custom domains under `luci-studio.com`.

### `tools-home` (root Pages project)
Serves everything not owned by an engine:
- `/` — the **hub**: landing page listing every tool, grouped by category, linking
  out. This is the authority distributor (and a strong SEO page in its own right).
- `/privacy/`, `/terms/`, `/about/`, `/contact/` — the single shared legal set.
- `/ads.txt` — the single AdSense ownership file.
- `/robots.txt` — site-wide.
- `/sitemap.xml` — a **sitemap index** referencing each engine repo's own
  `sitemap.xml` (e.g. `tools.luci-studio.com/image/sitemap.xml`).

> **Status — built (Phase 1) and deployed.** `tools-home/` is scaffolded: the hub
> (cross-engine catalog in `src/consts.ts`, grouped by engine), Privacy / Terms /
> About / Contact, `public/ads.txt` (placeholder pub-id + TODO) and
> `public/robots.txt`, plus the sitemap **index** (`/sitemap.xml`) and the home-pages
> sitemap (`/sitemap-home.xml`). Reuses the Option A design system (dark mode +
> toggle). `astro check` and build are green; previewed light + dark; canonicals
> resolve to the production host. **Deployed live** at `tools-home.pages.dev`, served
> at the root of `tools.luci-studio.com` via the Worker.

### A blog-side touchpoint (separate small task, lands in `luci_web_blog`)
Add a `/tools` page on `luci-studio.com` that promotes the portfolio and links to
`tools.luci-studio.com`. This is the ONE change that touches the blog repo; do it as
its own task, not here.

## 4. SEO playbook

The non-negotiables are in CLAUDE.md. The reasoning:

- **One keyword per page.** People search "png to jpg", not "image converter then
  pick formats". Directional converters are separate keywords with separate volume —
  ship one page each (`/image/png-to-jpg`, `/image/jpg-to-png`, …). This is why
  single-purpose tool pages win; it's the ilovepdf model.
- **Canonical trailing slash** — learned the hard way on the blog: CF Pages 307s
  no-slash → slash, and a no-slash canonical gets GSC "page with redirect" / wrong
  canonical and won't index.
- **Supporting content (how-to + FAQ)** per page — finance/health tools are YMYL
  (Google holds them to higher trust standards), and AdSense rejects thin pages
  regardless. Add a short how-to, a few FAQs, last-updated date, author/site info.
- **Internal linking network** — hub → tools, category hub → its tools, related
  cross-links. With one host this is what compounds authority across the portfolio.

## 5. Monetization detail

- **AdSense approval prerequisites:** enough original content, working navigation,
  Privacy + Terms + About/Contact pages, and some traffic/site age. The account is
  approved once (via the first qualifying state of the site); after that the single
  `tools.luci-studio.com` site covers all tools.
- **Consent / CMP:** EU visitors require a Google-certified consent banner before
  personalized ads. Configure one CMP at host level.
- **ads.txt:** one file at the root declares Google as an authorized seller.
- **Placement:** keep the tool above the fold and fully functional; place ads in the
  surrounding/below space. Never gate the tool behind an ad.
- **Affiliate (optional, later):** the blog already has affiliate infrastructure;
  tools can carry contextual affiliate links (e.g. a design tool → Canva) which
  often out-earn banner ads. Add only after the core tool + SEO are solid.
- **RPM reality:** target English/global intents for the high-RPM tools (image, PDF,
  dev). Keep VN-language tools for easy-to-rank volume, not primary revenue.

## 6. Legal / privacy requirements

Each shared page (hosted once at the root) must contain:
- **Privacy Policy:** what's collected (essentially nothing server-side; analytics +
  ad cookies via third parties), the "files processed in-browser, never uploaded"
  statement, third-party disclosures (Google AdSense/Analytics), and contact.
- **Terms:** "tool provided as-is, results for reference only, no warranty",
  acceptable use, liability limitation.
- **About / Contact:** who runs it + a contact method (AdSense wants this).

Not legal advice — have the user review before publishing.

## 7. Tool catalog (engine families → pages)

~44 engine-repos / ~200+ pages is the **universe of possibilities**, not a to-do
list. Pick a handful, validate, expand. Markers: 🔥 high traffic · 💰 high RPM ·
⚙️ heavy WASM.

### Image
- `image-converter` 🔥 — heic→jpg, heic→png, png→jpg, jpg→png, webp→png, webp→jpg,
  png→webp, jpg→webp, avif→jpg, png→avif, svg→png, png→svg
- `image-editor` 🔥 — compress, resize, crop, rotate/flip, circle-crop, collage,
  watermark, social-resize, passport-photo
- `background-remover` 🔥⚙️ — remove background (@imgly WASM, standalone)
- `exif-tools` — exif viewer, exif remover

### PDF
- `pdf-tools` 🔥 — merge, split, compress, pdf→jpg, jpg→pdf, rotate, delete/reorder,
  extract pages, page numbers, watermark, pdf→text, protect, unlock, sign, fill-form, n-up

### Video / Audio
- `video-tools` 🔥⚙️ — compress, video→gif, gif→video, trim, mp4→webm, mov→mp4,
  extract-audio, mute, merge (ffmpeg.wasm)
- `audio-tools` ⚙️ — mp3↔wav, convert, trim, mp4→mp3
- `recorder-tools` — screen / mic / webcam recorder (MediaRecorder)

### Text
- `text-tools` 🔥 — word/char counter, case converter, dedupe lines, sort lines,
  reverse, remove line breaks, repeat, find-replace, slugify
- `fancy-text-generator` 🔥 — bold/italic/cursive/strikethrough/small-caps Unicode
- `markdown-tools` — md→html, html→md, markdown table, preview

### Dev (💰 highest RPM)
- `json-tools` 💰🔥 — format/validate/minify, json↔yaml/csv/xml, json→typescript/go-struct
- `encode-decode-tools` 💰 — base64 encode/decode, url, html-entity, jwt decode, escape
- `hash-tools` 💰 — md5, sha1, sha256, sha512, hmac, bcrypt
- `id-generators` 💰 — uuid, ulid, nanoid, guid
- `regex-tester` 🔥 — tester, cheatsheet
- `cron-tools` 💰 — parser, builder, explainer
- `number-base-converter` — bin↔dec, hex↔dec, text→binary, octal
- `timestamp-converter` 🔥 — unix epoch ↔ date
- `minify-beautify` 💰 — html/css/js/json minify + beautify, sql formatter
- `mock-data-generator` — fake json, fake name, lorem ipsum
- `diff-checker` — text/code diff

### Design (💰)
- `css-generators` 💰 — gradient, box-shadow, border-radius, cubic-bezier,
  glassmorphism, neumorphism, clamp, flex/grid playground, pattern bg
- `color-tools` 💰 — hex↔rgb, hex↔hsl, color picker, palette, contrast (WCAG), palette-from-image

### Generators
- `qr-tools` 🔥 — qr generator, qr-with-logo, qr scanner, wifi qr, vcard qr, barcode
- `password-tools` — password, passphrase, strength, pin
- `random-tools` 🔥 — spin wheel / wheel-of-names, random picker, dice, coin,
  team randomizer, bracket
- `avatar-placeholder` — avatar/identicon, placeholder image

### Document generators (→ PDF)
- `invoice-generator` 💰 · `resume-builder` 🔥 · `certificate-generator` ·
  `signature-tools`

### Calculators (math, zero maintenance — avoid tax/salary/insurance)
- `finance-calculators` 🔥 — loan/amortization, compound interest, savings, %,
  discount, tip, split bill
- `health-calculators` 🔥 — bmi, calorie/tdee, body-fat, ideal weight, water, pace,
  due date, age
- `unit-converter` 🔥 — cm↔inch, kg↔lb, °C↔°F, m↔ft, km↔mile, ml↔oz, MB↔GB, area, speed…
- `date-time-tools` 🔥 — date difference, age, countdown, timezone, working days
- `math-calculators` — scientific, fraction, ratio, quadratic, std-dev, matrix, roman
- `screen-tools` — ppi/dpi, aspect ratio, screen size
- `network-calculators` 💰 — subnet/CIDR, IP tools

### SEO / Social
- `seo-tools` 💰 — meta tag, OG preview, twitter card, utm builder, json-ld,
  keyword density, robots.txt, sitemap
- `social-tools` — email signature, link-in-bio, hashtag, twitter/meta char counter

### Data / file
- `spreadsheet-tools` — csv↔excel, excel→json, csv viewer (sheetjs)
- `calendar-tools` — .ics event, vcard

### Productivity (lower ad value — apps, not search-tools)
- `productivity-tools` — pomodoro, todo, notes, stopwatch, world clock, whiteboard

## 8. Roadmap — what to build first

Ranked by (traffic × RPM × ease):

| # | Repo | Why first |
|---|---|---|
| 1 | `image-converter` | 🔥 huge global traffic, easy, contains the `heic→jpg` target; also sets the pattern every later repo copies |
| 2 | `fancy-text-generator` | 🔥 viral social traffic, ~1 day to build |
| 3 | `pdf-tools` | 🔥 traffic + high purchase intent |
| 4 | `json-tools` | 💰 highest dev RPM |
| 5 | `qr-tools` | 🔥 evergreen, easy |

`tools-home` + `tools-router` are built once there is ≥1 tool to route (see CLAUDE.md
build sequence). **Both are now DEPLOYED — the portfolio is live on
`tools.luci-studio.com`** (the Pages projects, 12 today, via `wrangler pages
deploy`; the Worker via `wrangler deploy` with a custom domain). The runbook + the first-deploy
gotchas are in [deploy.md](deploy.md).

## 9. Definition of Done (per tool)

- [ ] `npm run check` (astro check) clean
- [ ] Build green locally
- [ ] One page per keyword, with how-to + FAQ content
- [ ] Canonical ends in `/`; OG + Twitter + JSON-LD present
- [ ] Per-repo `sitemap.xml`; internal links to hub + related tools
- [ ] `base: '/<engine>'` set; deployed to `<engine>.pages.dev` and verified
- [ ] Routed under `tools.luci-studio.com/<engine>/...` (once router is live)

## 10. Open items / future decisions

- Choose the specific CMP (Google's own consent or a free certified CMP).
- Confirm the exact `tools-home` design / branding (logo, colors, fonts) — shared
  visual identity across tools, copied per repo (no shared package yet, by design).
- ~~Decide whether to version/`git init` this planning workspace itself~~ —
  **Done:** `kido-luci/luci-tools` versions it — first as a private meta-repo of
  tool submodules, now as the public monorepo that holds every tool and the shared
  docs (see §2).
- Revisit Ezoic/Mediavine migration once a tool crosses their traffic thresholds.

## 11. Internationalization (i18n) — design doc (NOT yet built)

> Status: **design only.** No i18n code exists yet. This section locks the
> architecture so that when we do build it, it is applied once and copied across
> repos consistently (the same way the Option A visual system was). **Do not start
> implementing from this section without an explicit go-ahead** — it is gated on the
> sequencing in §11.7.

### 11.1 Why it matters (and why it's not a bolt-on)

i18n is the single biggest lever on the revenue goal: every additional language
multiplies the indexable surface (more pages ranking for more localized intents →
more organic traffic → more ad impressions). It is *aligned* with the whole model.

But it is a **portfolio-wide architecture commitment**, not a setting you flip:

- **Translate the *intent*, not the string.** Search keywords differ per language and
  have independent volume: `heic to jpg` (en) vs `convertir heic a jpg` (es) vs
  `heic を jpg に変換` (ja). Each localized page targets a *separately-researched*
  keyword. No keyword research → no reason to add the language.
- **Thin/duplicate-content risk.** The SEO body (how-to + FAQ) is what ranks. Machine-
  translating it wholesale produces low-quality near-duplicate pages that Google can
  demote or drop. The ranking copy must be **human-quality / reviewed** per language.
- **hreflang + canonical are easy to get wrong, and wrong tanks indexing.** A broken
  alternates cluster is the classic way to lose the very pages you added.

### 11.2 URL architecture (decision)

Format: **`/<engine>/<lang>/<localized-slug>/`**, with the **default locale (English)
un-prefixed** so existing URLs never move:

```
/image/heic-to-jpg/            → en  (default, NO /en/ prefix — unchanged)
/image/es/heic-a-jpg/          → es
/image/fr/convertir-heic-jpg/  → fr
```

- **Default locale unprefixed** (`prefixDefaultLocale: false`): preserves every URL
  already indexed/ranking — no mass 301s, no equity loss, no Search-Console churn.
- **Language-only codes** (ISO 639-1: `es`, `fr`, `de`, `pt`, `ja`…). Start without
  region variants; only split (`pt-BR` vs `pt-PT`) if keyword data later demands it.
- **Localized slugs**, not a shared slug with a translated body. The slug *is* the
  keyword — `png-to-jpg` (en) vs `png-a-jpg` (es). Routing therefore maps
  `(locale, canonical-tool-id) → localized-slug`, kept in a per-repo table.
- **Worker is unaffected.** The first path segment is still the engine
  (`image` → the `image-converter` Pages origin); `base: '/<engine>'` composes with
  Astro i18n routing under it. `tools-router` routes on that first segment only, so
  it needs **no change**.

### 11.3 hreflang / canonical rules

- Every page emits a **self-referencing canonical** (its own trailing-slash URL).
- Every page emits the **full reciprocal hreflang cluster** for that tool — one
  `<link rel="alternate" hreflang="…">` per available locale, **absolute URLs**, plus
  `hreflang="x-default"` → the English page. Reciprocity is mandatory (each locale
  links to all the others, including back to itself).
- hreflang lives in `SeoHead.astro`, fed the tool's per-locale URL map.

### 11.4 Sitemaps

- Each repo's `sitemap.xml` lists all locale URLs, using **`xhtml:link` alternate
  annotations** per `<url>` (Google-recommended; avoids per-language file sprawl).
- `tools-home`'s sitemap **index** is unchanged — it still just references each repo's
  single `sitemap.xml`.

### 11.5 Content & string model (Astro)

The heavy part is content, not code. Two buckets:

- **UI strings** (header nav, trust chips, CTA labels, footer, dropzone copy) → a
  small `src/i18n/ui.ts` dictionary keyed by locale. Machine-seed, then review.
- **Per-page SEO copy** (title, description, h1, how-to steps, FAQ Q&A) + the
  **localized slug** → per-locale content collections / data keyed by
  `[locale][canonical-tool-id]`. This is the part that must be quality-translated.

Pages are generated with `getStaticPaths()` over `locales × tools`, output stays
fully static (`output: 'static'` unchanged). Astro config sketch (design, not final):

```js
// astro.config.mjs
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr', /* … keyword-research-driven */],
  routing: { prefixDefaultLocale: false },
}
```

### 11.6 Language switcher (UX + SEO guardrail)

- Header gets a locale dropdown that links to the **equivalent localized slug of the
  current tool** (not just the homepage) — so switching keeps you on the same intent.
- Persist the choice in `localStorage`. **Do NOT hard-redirect** on Accept-Language or
  IP on first visit: a searcher landed on the exact page they wanted, and Google's
  crawler is US-based — auto-redirecting elsewhere both hurts UX and can de-index the
  other locales. At most, show a dismissible "View in <language>?" hint.

### 11.7 Sequencing (the gate)

1. **Phase 0 — now:** this doc only. Ship the English portfolio, deploy, get pages
   indexed and ranking, get **AdSense approved**, and gather real traffic/RPM data.
2. **Phase 1 — pilot:** after that, pick **one** high-RPM, high-volume tool and **one**
   language (chosen by keyword research — likely a large-volume Latin-script language
   first), build the full pipeline end-to-end on it, and **measure** indexation +
   traffic before scaling.
3. **Phase 2 — roll out:** extend only the languages the pilot proved worthwhile,
   across the portfolio, via the same fan-out pattern used for the Option A redesign.

### 11.8 Open decisions to lock before Phase 1

- Which languages first (keyword-research-driven, per high-value tool).
- Language-only vs region variants.
- Translation workflow / source of truth (who/what produces the reviewed copy).
- Whether `tools-home` (hub + legal pages) is localized too — likely the hub yes; the
  legal set can stay English initially and localize later. Flag for the user.

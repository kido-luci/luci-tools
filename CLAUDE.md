# CLAUDE.md — luci-tools

Guidance for Claude Code when working in this workspace. These are the **shared
conventions every tool repo follows**. Full rationale, the tool catalog, and the
roadmap live in [docs/common-plan.md](docs/common-plan.md).

## What this is

`luci-tools` is a portfolio of **micro web tools** — image / PDF / dev / text
converters, generators, calculators — that:

- run **100% client-side** (Canvas / WASM / vanilla JS) → **no backend, $0 server**
- are hosted free on **Cloudflare Pages**
- are monetized by **ads** (Google AdSense), optionally affiliate
- live together under one host **`tools.luci-studio.com`**, separate from the
  personal blog (`luci-studio.com`) so they never pollute each other

**Goal:** SEO organic traffic → ad revenue. Each tool page targets exactly one
search intent (**one keyword = one URL**). This is the whole game — the tool being
free to host is the easy part; ranking it is where the money is.

## Architecture (decided)

```
tools.luci-studio.com
   │  Cloudflare Worker (tools-router): route path-prefix → Pages project
   ├─ /                       → tools-home   (hub / landing page listing all tools)
   ├─ /privacy /terms /about  → tools-home   (legal — ONE shared copy)
   ├─ /ads.txt /robots.txt /sitemap.xml → tools-home (sitemap = index of all repos)
   ├─ /image/*                → image-converter.pages.dev
   ├─ /pdf/*                  → pdf-tools.pages.dev
   └─ /json/*                 → json-tools.pages.dev   (etc.)
```

- **One host**, so authority pools and `ads.txt` / AdSense site / consent / legal
  are configured **once** at the root, not per tool.
- The **Worker is a pure pass-through proxy** — it only maps `/<engine>/*` to that
  engine's Pages project. It is the one piece of shared infra (and a single point
  of failure; keep it tiny and stable).
- Each engine = **its own repo + its own Pages project**, owning the path prefix
  `/<engine>/*`. Repos are fully independent (NOT git submodules).
- **Engine-prefix path scheme**: `/image/heic-to-jpg`, `/pdf/merge-pdf`, …
  Each repo sets Astro **`base: '/<engine>'`** so its internal links, canonical
  tags, and sitemap already match the production path → the Worker needs **no path
  rewriting** (avoids asset/canonical bugs).

## Locked decisions

- **Stack:** Astro `output: 'static'` + TypeScript + Tailwind v3 (build-time via
  PostCSS). Tool logic = vanilla JS / WASM, no React. **No Sentry, no SSR
  adapter** — so unlike the blog, `npm run dev` should work here. Verify per repo.
- **Hosting:** Cloudflare Pages. 1 repo = 1 Pages project, auto-deploy from `master`.
- **Repos:** GitHub org **`kido-luci`**, named `kido-luci/<engine>`
  (e.g. `kido-luci/image-converter`). Each independent.
- **Domain:** `tools.luci-studio.com`, engine-prefix paths.
- **Ads:** Google AdSense — **one** site (`tools.luci-studio.com`), **one** root
  `ads.txt`.
- **Analytics:** Cloudflare Web Analytics, **single shared beacon** injected by the
  `tools-router` Worker (HTMLRewriter, appended to every HTML response). Edge
  auto-inject does NOT survive the Worker proxy, so per-Pages-project "Enable" was
  abandoned. The one beacon token lives only in the Worker — do **not** also add a
  manual beacon in any engine repo, or pageviews double-count.
- **Legal:** Privacy / Terms / About live **once** at the root (`tools-home`);
  every tool links to them.

## Per-repo structure (skeleton)

```
<engine>/
├── astro.config.mjs        # output: 'static', base: '/<engine>'
├── src/
│   ├── pages/<keyword>.astro    # one page per search intent
│   ├── pages/index.astro        # category hub (e.g. /image/) listing this engine's tools
│   ├── lib/<engine>.ts          # the shared client-side engine (the actual work)
│   ├── components/{Header,Footer,ToolShell,AdSlot,FAQ,SeoHead}.astro
│   └── content/                 # per-page how-to + FAQ copy (SEO body)
├── public/                      # static assets (NO ads.txt/robots here — those are at root)
└── package.json
```

## SEO rules (the money — non-negotiable per page)

- **One page = one keyword.** `<title>`, meta description, and a single `<h1>` all
  match that intent.
- **Canonical URL MUST end with `/`.** Cloudflare Pages 307-redirects the no-slash
  form to the slash form; a no-slash canonical makes Search Console flag the page
  as "page with redirect" / alternate canonical and it won't index. Sitemap entries
  use the trailing slash too.
- Every page emits **OpenGraph + Twitter card + JSON-LD `SoftwareApplication`**.
- Every tool page needs **supporting content** (how-to + FAQ). Thin "single input
  field" pages get AdSense-rejected and don't rank.
- Per-repo `sitemap.xml`; `tools-home` emits a **sitemap index** referencing them.
  `robots.txt` lives only at the root.
- **Internal links:** hub ↔ tool, category hub (`/image/`) ↔ its tools, plus
  related-tool cross-links. This is how authority flows across the portfolio.
- Slugs: kebab-case, English, keyword-shaped (`heic-to-jpg`).

## Monetization

- AdSense + a single root `ads.txt`.
- A **consent (CMP) banner** is required for EU traffic — use a Google-certified
  CMP, configured once at host level.
- **Ad placement:** the tool itself stays above the fold and fully usable; ads go
  around/below, never blocking the function.
- Affiliate links optional, added later.

## Privacy / trust

Tools process files **in the browser and store nothing**. Say so prominently
("100% in your browser — nothing is uploaded"). It is both a legal posture (no
personal data leaves the device → outside data-protection obligations like
VN Decree 13/2023) and a selling point.

## Git workflow

- Per repo: `master` + topic branches (`feat/…`, `fix/…`, `chore/…`), land via PR.
  Auto-deploy from `master` (Cloudflare Pages). Never push straight to `master`.
- GitHub free plan → branch protection is a **convention**, not server-enforced.
- One focused change per commit. End every commit **you author** with a
  `Co-Authored-By: Claude <model> <noreply@anthropic.com>` trailer, using the exact
  running-model name (e.g. `Claude Opus 4.8`).
- A release = merge to `master` **then** an annotated tag `vX.Y.Z` (each repo
  versioned independently).

## Build / verify

- **Verify gate:** `npm run check` (astro check) must be clean before commit.
- Pure static + no Sentry → `astro dev` should work; still confirm the tool's
  actual behavior in the browser. Verify, don't assume.
- Cloudflare builds with **npm 10.9.2**; local npm 11 writes lockfiles that fail
  `npm ci` there. After dependency changes, reconcile:
  `npx npm@10.9.2 install --package-lock-only`.
- Build green locally before any release.

## Build sequence (first time)

1. Build the first tool (`image-converter`) standalone → deploy to
   `image-converter.pages.dev`, verify it works.
2. Build `tools-home` (hub + legal pages + `ads.txt` + sitemap index).
3. Build `tools-router` Worker; point `tools.luci-studio.com` at it; attach the
   engine Pages projects.
4. Apply to AdSense once `tools.luci-studio.com` has real content and traffic.

## Per-repo chats

Each tool is built in its **own chat**, with the cwd set to that repo's folder, so
this CLAUDE.md is inherited as shared context. Keep design discussion here; keep
implementation in the per-repo chats.

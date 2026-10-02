# CLAUDE.md — luci-tools

Guidance for Claude Code when working in this workspace. These are the **shared
conventions every engine follows**. Full rationale, the tool catalog, and the
roadmap live in [docs/common-plan.md](docs/common-plan.md); the deploy runbook is
[docs/deploy.md](docs/deploy.md).

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
   ├─ /ads.txt /robots.txt /sitemap.xml → tools-home (sitemap = index of all engines)
   ├─ /image/*                → image-converter-69t.pages.dev
   ├─ /pdf/*                  → pdf-tools-bh7.pages.dev
   └─ /json/*                 → json-tools-b17.pages.dev   (etc.)
```

`*.pages.dev` subdomains are globally unique, so most origins carry a
Cloudflare-assigned suffix. The authoritative prefix → origin map is `ORIGINS`
in `tools-router/src/routes.ts`; never guess a host from the directory name.

- **One host**, so authority pools and `ads.txt` / AdSense site / consent / legal
  are configured **once** at the root, not per tool.
- The **Worker rewrites the path** — it maps `/<prefix>/*` to that engine's Pages
  project and **strips the prefix**, because Astro's `base` does not nest the build
  output: each engine's `dist` is served at its origin root (`/heic-to-jpg/`, not
  `/image/heic-to-jpg/`). It re-adds the prefix when rewriting redirect `Location`
  headers. It is the one piece of shared infra (and a single point of failure; keep
  it tiny and stable).
- The Worker also adds the security headers Pages does not send, to every
  response: a Content-Security-Policy (sent as `Content-Security-Policy-Report-Only`
  until the live consoles are clean; `'unsafe-eval'` under `/image` only, for
  heic2any's worker), `X-Frame-Options: SAMEORIGIN` and
  `Strict-Transport-Security: max-age=31536000`. A page that loads a new
  third-party script, style, font or connection needs the CSP in
  `tools-router/src/index.ts` updated first.
- Each engine = **its own top-level directory in this monorepo + its own Pages
  project**, owning one path prefix. (Consolidated 2026-07-31 — the former
  per-engine repos were subtree-merged in with full history, then deleted
  2026-08-04.)
- **Engine-prefix path scheme**: `/image/heic-to-jpg`, `/pdf/merge-pdf`, …
  The prefix is **not** always the directory name: `fancy-text-generator` → `/fancy-text`,
  `timestamp-converter` → `/time`, `unit-converter` → `/unit`, `color-tools` → `/color`,
  `encode-decode` → `/encode`. Each engine sets Astro **`base: '/<prefix>'`** so its
  internal links, canonical tags, and sitemap match the production path.

## Locked decisions

- **Stack:** Astro `output: 'static'` + TypeScript + Tailwind v3 (build-time via
  PostCSS). Tool logic = vanilla JS / WASM, no React. **No Sentry, no SSR
  adapter** — so unlike the blog, `npm run dev` should work here. Verify per engine.
- **Hosting:** Cloudflare Pages. 1 engine directory = 1 Pages project
  (**direct-upload** — no git integration). Deploys are **manual**:
  `wrangler pages deploy <engine>/dist --project-name <engine> --branch master`
  (wrangler is OAuth-authed locally). The **project name is the directory name**;
  only the assigned `*.pages.dev` domain may carry a suffix — `wrangler pages
  project list` shows both. The Worker deploys via `npm run deploy` in
  `tools-router/`.
- **Repo:** the single monorepo **`kido-luci/luci-tools`**; each engine is a
  top-level directory. The old per-engine `kido-luci/<engine>` repos were deleted
  2026-08-04 — this monorepo is the only remaining copy.
- **Domain:** `tools.luci-studio.com`, engine-prefix paths.
- **Ads:** Google AdSense — **one** site (`tools.luci-studio.com`), **one** root
  `ads.txt`.
- **Analytics:** Cloudflare Web Analytics — **no setup needed in these repos.**
  `tools.luci-studio.com` is a subdomain of the proxied `luci-studio.com` zone,
  whose **automatic** Web Analytics already edge-injects its beacon onto every
  tools page (it DOES survive the `tools-router` Worker — verify with real
  browser headers, not a bot UA: Cloudflare skips the auto-beacon for bots). So
  do **not** inject a manual beacon (Worker or engine repo) — a second beacon
  double-counts and its dedicated site stays empty (the zone beacon inits first).
  View tools traffic in the `luci-studio.com` Web Analytics site, filtered by
  hostname `tools.luci-studio.com`.
- **Legal:** Privacy / Terms / About live **once** at the root (`tools-home`);
  every tool links to them.

## Per-engine structure (skeleton)

```
<engine>/
├── astro.config.mjs        # output: 'static', base: '/<prefix>'
├── src/
│   ├── pages/<keyword>.astro    # one page per search intent, with its how-to + FAQ copy (SEO body)
│   ├── pages/index.astro        # category hub (e.g. /image/) listing this engine's tools
│   ├── pages/404.astro          # Pages serves it with a 404 for unknown paths; not in the sitemap
│   ├── lib/<engine>.ts          # the shared client-side engine (the actual work)
│   └── components/{Header,Footer,ToolShell,AdSlot,FAQ,SeoHead}.astro
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
- Per-engine `sitemap.xml`; `tools-home` emits a **sitemap index** referencing them.
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

- One monorepo: `master` + topic branches (`feat/…`, `fix/…`, `chore/…`), land
  via PR. Never push straight to `master`. Deploys are decoupled from git —
  after merging, run the wrangler deploy for the engine(s) you changed.
- CI runs per-directory: `.github/workflows/ci-<engine>.yml`, path-filtered to
  `<engine>/**` (npm ci + check + test + build inside that directory). Nine
  engines run `npm run test:coverage`, so their 90% thresholds are enforced;
  encode-decode and timestamp-converter still run plain `test` because their
  coverage is below the thresholds.
- `master` is protected server-side since 2026-10-02: a PR is required, and
  force-push and deletion are blocked for everyone. Admins can still bypass the PR
  rule, so "never push straight to `master`" stays a convention as well.
- One focused change per commit. End every commit **you author** with a
  `Co-Authored-By: Claude <model> <noreply@anthropic.com>` trailer, using the exact
  running-model name (e.g. `Claude Opus 4.8`).
- A release = merge to `master` **then** an annotated per-engine tag
  `<engine>/vX.Y.Z` (engines stay versioned independently). The old repos' plain
  `vX.Y.Z` tags did **not** survive the consolidation — `git subtree add` imports
  commits, not tags, and the source repos were deleted 2026-08-04. Every
  pre-consolidation commit is present; the tags restart from the 2026-08-04
  version baseline (`<engine>/v0.3.0` for the 11 engines, `tools-home/v0.4.0`,
  `tools-router/v0.1.0`).
- After deploying a release, run `scripts/smoke.sh`: every sitemap URL must
  answer 200, unknown URLs 404, and every response must carry the router's
  security headers.
- **After a topic branch is merged/landed, `git checkout` back to `master`
  locally** so the working tree is clean and not left sitting on a merged
  branch.

## Build / verify

- **Verify gate:** `npm run check` (astro check) must be clean before commit.
- Pure static + no Sentry → `astro dev` should work; still confirm the tool's
  actual behavior in the browser. Verify, don't assume.
- Cloudflare builds with **npm 10.9.2**; local npm 11 writes lockfiles that fail
  `npm ci` there. After dependency changes, reconcile:
  `npx npm@10.9.2 install --package-lock-only`.
- Build green locally before any release.

## Build sequence (first time)

1. Build the first tool (`image-converter`) standalone → deploy to its Pages
   project (served at `image-converter-69t.pages.dev`), verify it works.
2. Build `tools-home` (hub + legal pages + `ads.txt` + sitemap index).
3. Build `tools-router` Worker; point `tools.luci-studio.com` at it; attach the
   engine Pages projects.
4. Apply to AdSense once `tools.luci-studio.com` has real content and traffic.

## Per-tool chats

Each tool is best worked on in its **own chat**, with the cwd set to that tool's
directory, so this CLAUDE.md is inherited as shared context. Keep design
discussion here; keep implementation in the per-tool chats.

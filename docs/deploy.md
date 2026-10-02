# Deploy runbook — Luci Tools (Phase 2)

How to take the portfolio live on `tools.luci-studio.com`. Order is mandatory:
**Pages projects → Worker → custom domain → verify** (the Worker proxies to
`*.pages.dev`, so the Pages projects must exist first). There are **12** today —
11 engines plus `tools-home`.

## Prerequisites

- A Cloudflare account that already holds the **`luci-studio.com`** zone (the blog).
  `tools.luci-studio.com` is just a subdomain of it — no new domain to buy.
- Access to the GitHub org **kido-luci** (you'll authorize the Cloudflare GitHub app
  to read the `luci-tools` repo).

## Step 0 — lockfile compatibility (prep)

Cloudflare Pages builds with **npm 10.9.2** and runs `npm ci`; a `package-lock.json`
written by npm 11 can fail there. Before the first build, each engine's lockfile
must be reconciled:

```sh
npx npm@10.9.2 --prefix <engine> install --package-lock-only
```

(Handled per engine via a small PR. The Worker directory `tools-router` deploys via local
`wrangler`, not Cloudflare's npm, so it does not need this.)

## Step 1 — deploy the Pages projects

> **Status (2026-08-04):** all 12 projects are deployed via CLI (`wrangler pages deploy`).
> Git integration (`Connect to Git`) is **not connected** — `wrangler pages project list`
> reports `Git Provider: No` for every project, so pushing to `master` does NOT
> auto-deploy. Use the CLI workflow below until you connect Git in the dashboard.

### Option A — CLI deploy (current method)

Build and push each engine manually, from the monorepo root:

```sh
# engines: image-converter, fancy-text-generator, json-tools, qr-tools, pdf-tools,
#          unit-converter, hash-tools, timestamp-converter, encode-decode,
#          color-tools, password-tools — plus tools-home
npm --prefix <engine> run build
npx wrangler pages deploy <engine>/dist --project-name <engine> --branch master --commit-dirty=true
```

> **Project name vs domain.** The **project name is the plain directory name**
> (`image-converter`, `fancy-text-generator`, …) — that is what `--project-name`
> takes. Only the assigned **domain** carries Cloudflare's uniqueness suffix
> (`image-converter-69t.pages.dev`, `fancy-text-generator-2p7.pages.dev`). Run
> `wrangler pages project list` to see both columns; the domains are also hardcoded
> in the Worker's `ORIGINS` map, which is the source of truth for routing.

### Option B — connect Git integration (recommended for long-term)

Dashboard → **Workers & Pages → \<project\> → Settings → Build & deployments →
Connect to Git** → pick the GitHub repo, then:

| Setting | Value |
|---|---|
| Production branch | `master` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Env var | `NODE_VERSION` = `22` |

Once connected, every merge to `master` auto-deploys. Do this for all 12 projects.
In the monorepo, also set each project's **root directory** to its `<engine>/` and
path-filter the build so an unrelated engine's change does not redeploy everything.

Smoke-test each on its real domain: `https://image-converter-69t.pages.dev/`,
`https://tools-home.pages.dev/` (engine `dist` serves at the origin root — the
`/image/` prefix only exists behind the Worker).

## Step 2 — deploy the Worker (`tools-router`)

```sh
cd tools-router
npx wrangler login      # browser OAuth — no API token needed
npx wrangler deploy
```

## Step 3 — point `tools.luci-studio.com` at the Worker (Custom Domain)

Let the Worker own the whole hostname (auto DNS + SSL, all traffic → Worker). The
`wrangler.jsonc` route is configured as a custom domain:

```jsonc
"routes": [ { "pattern": "tools.luci-studio.com", "custom_domain": true } ]
```

`npx wrangler deploy` provisions it. (Dashboard alternative: Worker `tools-router` →
**Settings → Domains & Routes → Add → Custom Domain** → `tools.luci-studio.com`.)

## Step 4 — verify end-to-end

- `https://tools.luci-studio.com/` → hub
- `https://tools.luci-studio.com/image/heic-to-jpg/` → an image tool
- `/privacy/`, `/ads.txt`, `/robots.txt`, `/sitemap.xml`
- Request a no-trailing-slash path (`…/heic-to-jpg`) → must `307` to the slash form
  **and stay on `tools.luci-studio.com`** (this is the Worker's `Location` rewrite).

## Step 5 — after deploy

- **Cloudflare Web Analytics:** nothing to enable. The `luci-studio.com` zone's
  automatic Web Analytics already covers `tools.luci-studio.com`, and a second
  beacon double-counts (see CLAUDE.md → Analytics).
- **AdSense:** apply once there is real content + traffic; when approved, put the real
  publisher id into `tools-home/public/ads.txt` (replace `pub-0000…`).
- **Deploying:** until Git integration is connected (see Step 1 Option B), each change
  requires `npm --prefix <engine> run build && npx wrangler pages deploy <engine>/dist --project-name <engine> --branch master`.
  After connecting Git, pushing to `master` auto-redeploys.

## Doing the CLI steps via API token (optional)

To have the CLI steps (2–3) run non-interactively/in CI, create a scoped
`CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit · Pages: Edit · Zone `luci-studio.com`)
and provide it as an **environment variable** — never commit it. Otherwise
`wrangler login` (browser OAuth) is enough.

## First-deploy gotchas (resolved)

The initial deploy was done via CLI (`wrangler pages deploy dist` per site +
`wrangler deploy` for the Worker) and hit two non-obvious issues, both now handled
in `tools-router/src/routes.ts`:

1. **`<engine>.pages.dev` is globally unique.** The plain names were taken, so
   Cloudflare assigned suffixed origins (`image-converter-69t.pages.dev`, …). The
   Worker's `ORIGINS` map hardcodes the real hosts — check `wrangler pages project
   list` for the actual domains, and update `ORIGINS` if a project is recreated.
2. **Astro `base` does not nest the build output.** `dist/` serves at the origin
   root (`/heic-to-jpg/`, not `/image/heic-to-jpg/`), so the Worker strips the
   `/<engine>` prefix before proxying and re-adds it on redirect `Location` headers.
   This means a flat `dist` deploy is correct — do **not** try to nest it.

Bare `*.pages.dev` origins have broken internal links (they point at `/<engine>/…`,
which only exists behind the Worker); that is fine — users and canonicals use
`tools.luci-studio.com`. Optionally mark the `*.pages.dev` origins `noindex` later.

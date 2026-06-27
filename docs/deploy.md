# Deploy runbook — Luci Tools (Phase 2)

How to take the portfolio live on `tools.luci-studio.com`. Order is mandatory:
**6 Pages projects → Worker → custom domain → verify** (the Worker proxies to
`*.pages.dev`, so the Pages projects must exist first).

## Prerequisites

- A Cloudflare account that already holds the **`luci-studio.com`** zone (the blog).
  `tools.luci-studio.com` is just a subdomain of it — no new domain to buy.
- Access to the GitHub org **kido-luci** (you'll authorize the Cloudflare GitHub app
  to read the private repos).

## Step 0 — lockfile compatibility (prep)

Cloudflare Pages builds with **npm 10.9.2** and runs `npm ci`; a `package-lock.json`
written by npm 11 can fail there. Before the first build, each Pages repo's lockfile
must be reconciled:

```sh
npx npm@10.9.2 --prefix <repo> install --package-lock-only
```

(Handled per repo via a small PR. The Worker repo `tools-router` deploys via local
`wrangler`, not Cloudflare's npm, so it does not need this.)

## Step 1 — deploy the 6 Pages projects (git integration, auto-deploy from `master`)

Repeat for each: `image-converter`, `fancy-text-generator`, `json-tools`, `qr-tools`,
`pdf-tools`, `tools-home`.

Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo, then:

| Setting | Value |
|---|---|
| Production branch | `master` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Env var | `NODE_VERSION` = `22` |

**Save and Deploy** → you get `https://<repo>.pages.dev`.

> The Pages **project name must equal the repo name** (`image-converter`, …,
> `tools-home`) — the Worker maps `image → image-converter.pages.dev`, etc. Cloudflare
> defaults the project name to the repo name, so leave it as-is.

Smoke-test each: `https://image-converter.pages.dev/image/`, `https://tools-home.pages.dev/`.

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

- **Cloudflare Web Analytics:** enable per project (auto-inject).
- **AdSense:** apply once there is real content + traffic; when approved, put the real
  publisher id into `tools-home/public/ads.txt` (replace `pub-0000…`).
- From now on, **pushing `master` of any repo auto-redeploys** that Pages project.

## Doing the CLI steps via API token (optional)

To have the CLI steps (2–3) run non-interactively/in CI, create a scoped
`CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit · Pages: Edit · Zone `luci-studio.com`)
and provide it as an **environment variable** — never commit it. Otherwise
`wrangler login` (browser OAuth) is enough.

## First-deploy gotchas (resolved)

The initial deploy was done via CLI (`wrangler pages deploy dist` per site +
`wrangler deploy` for the Worker) and hit two non-obvious issues, both now handled
in `tools-router/src/index.ts`:

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

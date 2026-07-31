# Luci Tools

Monorepo for the **Luci Tools** portfolio: small, single-purpose,
100%-client-side web tools (image / PDF / JSON / QR / text…) hosted free on
Cloudflare under one host, **[tools.luci-studio.com](https://tools.luci-studio.com)**.

## Layout

Every tool lives as a top-level directory with its own full git history
(imported from the former per-tool repos via subtree merge, 2026-07-31):

- **Engines** — `image-converter`, `pdf-tools`, `json-tools`, `qr-tools`,
  `fancy-text-generator`, `unit-converter`, `hash-tools`,
  `timestamp-converter`, `encode-decode`, `color-tools`, `password-tools`
- **Infra** — `tools-home` (hub + legal + sitemap index), `tools-router`
  (Cloudflare Worker reverse proxy mapping `/<prefix>/*` to each engine's
  Pages project)
- `CLAUDE.md`, `docs/` — shared conventions, rationale and roadmap

## Working in a tool

```sh
cd <tool>
npm install
npm run dev      # engines are plain static Astro — dev works
npm run check    # type gate before committing
```

Changes land via topic branch → PR into `master`. CI runs per-directory
(`.github/workflows/ci-<tool>.yml`, path-filtered). Each engine deploys to its
own Cloudflare Pages project via `wrangler pages deploy` — deploys are manual
and independent of git pushes.

## License

[AGPL-3.0-only](./LICENSE) © Luci Studio — covers every tool in this repo.

You are free to use, study, modify, and self-host this code. If you run a
modified version as a network service, the AGPL requires you to offer its
source to your users under the same license.

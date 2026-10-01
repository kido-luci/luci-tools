# Contributing

This directory is one tool in the **luci-tools** monorepo — a client-side micro
web tool built with Astro (static) + TypeScript + Tailwind. Everything runs in the
browser: no backend, no SSR, no secrets.

## Workflow

- **Branches:** `master` is protected by convention — never push to it directly.
  Work on a topic branch: `feat/…`, `fix/…`, or `chore/…`.
- **Commits:** one focused change per commit. When a change is AI-authored, end the
  commit message with a `Co-Authored-By: Claude <model> <noreply@anthropic.com>`
  trailer using the exact running-model name.
- **Pull requests:** open against `master`. CI (`check` → `test` → `build`) must be
  green. The head branch is deleted automatically on merge.
- **Releases:** merge to `master`, then push an annotated per-engine tag
  `fancy-text-generator/vX.Y.Z`. Deploying is a separate, manual `wrangler pages deploy`;
  see [docs/deploy.md](../docs/deploy.md).

## Local development

```bash
npm install
npm run dev      # local dev server
npm run check    # astro check (type-check) — must be clean
npm run test     # vitest unit tests
npm run build    # production build — must be green
```

After changing dependencies, reconcile the lockfile for Cloudflare's npm version:

```bash
npx npm@10.9.2 install --package-lock-only
```

## Principles

- **100% client-side** — files and data never leave the browser.
- **One page = one keyword.** Title, meta description, and the single `<h1>` all
  match one search intent. Canonical URLs end with `/`.
- Minimal & surgical changes; match the existing code style.

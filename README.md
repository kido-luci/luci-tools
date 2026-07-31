# Luci Tools — workspace (meta-repo)

Aggregator for the **Luci Tools** portfolio: a set of small, single-purpose,
100%-client-side web tools (image / PDF / JSON / QR / text…) hosted free on
Cloudflare Pages under one host, `tools.luci-studio.com`.

**This repo is a management / backup layer only.** Each tool is an independent
GitHub repo with its own Cloudflare Pages project that auto-deploys from its own
`master`. The submodules here are a convenience for cloning everything at once,
versioning the shared planning docs, and pinning a coherent snapshot of the whole
portfolio — they do **not** affect how any individual tool deploys.

## Layout

- `CLAUDE.md`, `docs/` — shared conventions, rationale and roadmap (the source of truth).
- `.claude/launch.json` — local dev-server definitions for previewing every tool.
- Submodules (each an independent repo + its own Pages project):
  - **Engines** — `image-converter`, `fancy-text-generator`, `json-tools`, `qr-tools`, `pdf-tools`
  - **Infra** — `tools-home` (hub + legal + sitemap index), `tools-router` (Cloudflare Worker reverse proxy)

## Clone

```sh
git clone --recurse-submodules https://github.com/kido-luci/luci-tools.git
# or, after a plain clone:
git submodule update --init --recursive
```

## Working in a tool

Submodules check out in detached HEAD. To make changes:

```sh
cd <tool>
git checkout master
# …edit, commit, push as usual — the tool repo is fully independent…
```

Then, optionally, record the new pin in this meta-repo:

```sh
git add <tool> && git commit -m "chore: bump <tool> pointer"
```

The pointer is only a snapshot; each tool repo and its Cloudflare deployment are
the source of truth. See [docs/common-plan.md](docs/common-plan.md) for the full
architecture and rationale.

## License

[AGPL-3.0-only](./LICENSE) © Luci Studio — this meta-repo and every tool
submodule carry the same license.

You are free to use, study, modify, and self-host this code. If you run a
modified version as a network service, the AGPL requires you to offer its
source to your users under the same license.

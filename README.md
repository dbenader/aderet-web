# Aderet Prospect Engine

An internal, CLI-first production line that crawls an existing business website, creates a traceable factual brief, directs a coding agent to build a standalone redesign, validates the result, and publishes it as a static preview.

The generator deliberately has no shared site template. The source website supplies facts and assets; the coding agent owns each redesign.

## Quick start

Requires Node 20+, npm, the Codex CLI, and (for deployment) AWS CLI credentials.

```bash
npm install
npm run dev
```

Create a prospect locally without deploying:

```bash
npm run prospect -- https://example-plumber.com --no-deploy
```

The command prints the prospect ID. Its complete working set lives under `prospects/<id>/`:

```text
source/pages/          original HTML snapshots
source/crawl.json      structured extraction with source URLs
assets/                downloaded image assets and manifest
brief.md               normalized, source-bound business brief
generation-prompt.md   exact agent handoff
site/                  independent generated website project
validation.json        build verification result
prospect.json          pipeline status and preview URL
```

### Run stages separately

```bash
npm run crawl -- https://example.com
npm run generate -- <id>
npm run validate -- <id>
npm run deploy -- <id>
```

Use `--no-generate` to crawl and prepare a brief only. The crawler stays on the original origin, prioritizes common business pages, caps itself at 12 pages by default, waits between requests, and never attempts to bypass access controls. Set `ADERET_MAX_PAGES` to change the cap.

If the coding-agent executable is not named `codex`, set `ADERET_AGENT_COMMAND`. The permanent generation rules are in `AGENTS.md`; each run also writes its complete task to `generation-prompt.md`.

## Validation

Validation installs the generated site's locked dependencies where available, runs its production build, requires an `index.html`, and checks direct local references in that entry document. It writes a machine-readable result. Human visual review remains required before outreach.

## AWS deployment

The safe, isolated S3 + CloudFront stack and DNS cutover notes are in [infrastructure/README.md](infrastructure/README.md). Deployment refuses to run without an explicit `ADERET_BUCKET`. No existing AWS resource is inferred or modified.

```bash
export ADERET_BUCKET='<isolated stack bucket output>'
export ADERET_DISTRIBUTION_ID='<distribution output>'
export ADERET_PUBLIC_URL='https://aderet.tech'

npm run deploy -- <id>
npm run deploy:main
```

The dashboard deploy preserves the entire `preview/` prefix. A prospect deploy changes only its own `preview/<id>/` prefix.

## Current MVP boundary

The hosted dashboard is static: it displays the prospect register created during `npm run build` and gives you the correct local command. Crawling, agent generation, and AWS publishing run on the trusted workstation where credentials and source files already live. A remote job API, auth, database, CMS, customer domains, and custom application features are intentionally deferred.

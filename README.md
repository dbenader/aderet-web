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
outreach-prompt.md     exact outreach-writing handoff
outreach.md            tailored text message, email, and private source notes
site/                  independent generated website project
validation.json        build verification result
prospect.json          pipeline status and preview URL
```

### Run stages separately

```bash
npm run crawl -- https://example.com
npm run generate -- <id>
npm run outreach -- <id>
npm run validate -- <id>
npm run deploy -- <id>
```

Use `--no-generate` to crawl and prepare a brief only. The crawler stays on the original origin, prioritizes common business pages, caps itself at 12 pages by default, waits between requests, and never attempts to bypass access controls. Set `ADERET_MAX_PAGES` to change the cap.

If the coding-agent executable is not named `codex`, set `ADERET_AGENT_COMMAND`. Set `ADERET_OUTREACH_SENDER` to the sender identity that should appear in the messages. The permanent generation rules are in `AGENTS.md`; each run also writes its complete task to `generation-prompt.md`.

The builder prefers strong, authentic source-site photography, but directs the coding agent to use relevant Unsplash stock when the supplied imagery is poor or insufficient. To use the official API, put your public Unsplash access key (not the secret key) in `.env` as `UNSPLASH_ACCESS_KEY`. The generated site records stock selections in `site/stock-images.md`; API selections use Unsplash's returned image URLs and visible photographer attribution. The key is available only during generation and must never be embedded in the generated site.

Website generation also creates `outreach.md`. It contains a text message of at most 320 characters, a concise cold email, and private personalization notes that identify the sourced details used. Both messages include the expected preview URL. Run `npm run outreach -- <id>` to regenerate only this artifact after editing a brief or changing the sender identity. Outreach is intentionally kept out of the public prospect index and must be reviewed by the human sender before use.

## Validation

Validation installs the generated site's locked dependencies where available, runs its production build, requires an `index.html`, and checks direct local references in that entry document. It writes a machine-readable result. Human visual review remains required before outreach.

## Promote a prospect to a client

After a prospect converts, promote its validated site into an ongoing client workspace:

```bash
npm run promote -- <prospect-id> --client <client-slug>
```

Client slugs use lowercase letters, numbers, and single hyphens. Promotion rebuilds and validates the prospect, refuses to overwrite another client, and creates:

```text
clients/<client-slug>/
  client.json             client lifecycle and deployment status
  intake/                 frozen brief, source evidence, assets, outreach, and generation record
  facts/                  client-provided, explicitly approved factual material
  site/                   clean working site without dependencies or build output
```

The original prospect remains in place and is marked `won` with a link to the client. Promotion is safe to retry for the same prospect/client pair. It does not configure hosting, change DNS, rewrite the preview base path, or deploy production code.

## Deploy an approved client

Client production hosting uses an isolated private S3 bucket, CloudFront distribution, and ACM certificate. DNS remains external and is never changed automatically.

First, set the AWS account guardrail in `.env` so client resources cannot accidentally be created in the wrong account:

```dotenv
ADERET_CLIENT_AWS_ACCOUNT_ID=123456789012
ADERET_CLIENT_AWS_REGION=us-east-1
```

Read the active account ID with `aws sts get-caller-identity --query Account --output text`. The commands stop before making changes when the configured and active account IDs differ.

Start provisioning with the canonical production hostname. Using `www` is simplest for DNS providers such as GoDaddy:

```bash
npm run client:provision -- <client-id> --domain www.example.com
```

The first run requests the certificate and prints its DNS validation CNAME. Add that one record without changing the live website or any email records. After AWS reports the certificate as issued, rerun the same command without the domain:

```bash
npm run client:provision -- <client-id>
```

The second phase creates or updates the client CloudFormation stack and prints the eventual production CNAME target. Build and publish the site before changing live DNS:

```bash
npm run client:deploy -- <client-id>
```

Deployment builds the client site at `/`, rejects leftover prospect preview paths or broken entry-document references, syncs only to that client's retained bucket, invalidates only that client's distribution, and prints the CloudFront target again. After deployment succeeds, review the existing DNS zone, point `www` to that target, and use the DNS provider's permanent HTTPS forwarding for the root domain. Finally, verify that the custom domain serves the exact deployed build:

```bash
npm run client:verify -- <client-id>
```

The client is marked active only after this check passes. Repeating these commands is safe; none of them changes nameservers or DNS records.

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

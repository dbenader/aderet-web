# Aderet website generation rules

This repository generates modern replacement websites from factual source material. Each generated prospect website is an independent project under `prospects/<id>/site`. Converted, ongoing client projects live under `clients/<id>/site`.

## Non-negotiable factual accuracy

`prospects/<id>/brief.md` and its cited source pages are the only authority for business facts. Never invent testimonials, reviews, certifications, awards, company history, employee names, pricing, services, service areas, locations, phone numbers, statistics, guarantees, or hours. A missing fact is unknown and must be omitted. Marketing copy may be improved only without adding factual claims.

For a converted client, `clients/<id>/intake/brief.md`, its cited source pages, and material in `clients/<id>/facts/` that is explicitly marked as client-provided and approved are the only factual authorities. The frozen `intake/` record must not be rewritten; corrections and newly approved facts belong in `facts/` with their source and approval date.

Prospect outreach must follow the same factual restrictions. It may make a thoughtful inference about a business opportunity only when clearly framed as an observation, never as a claimed performance result or known problem. Do not invent a decision-maker, prior relationship, traffic, conversion data, urgency, discounts, or promises. Outreach is a draft for individual human review, not authorization to contact anyone or automate messaging.

## Generated site quality

- Treat the existing website as an information source, never as the visual template.
- Read the prospect's `assessment.md`, `build-plan.json`, and `source/discovery.json` before generation. The approved build plan controls whether project galleries and other high-value content collections are included; do not silently reduce that scope.
- A prospect preview must be credible as the business's replacement website, not merely a sales-pitch landing page. Rebuild all meaningful content for small and moderate sources. For larger sources, follow the operator-approved completeness choice in `build-plan.json`; omit CMS plumbing and repetitive archives rather than core business content.
- Visitor-facing copy must speak entirely in the business's voice. Never mention that the site is a prospect, preview, concept, redesign, replacement, generated site, or that content came from an original/source/existing website. Keep provenance and verification notes only in internal artifacts such as the brief, assessment, manifests, and outreach notes.
- Design each site from first principles for that business; do not create or reuse a shared template, theme, JSON renderer, or repo-wide component library.
- Produce a responsive, accessible, fast static marketing site with strong mobile treatment, semantic HTML, appropriate SEO metadata, and clear truthful calls to action.
- Prefer React, Vite, and TypeScript. Keep dependencies small.
- Configure prospect sites with the base path `/preview/<id>/` and ensure nested paths and assets work there. Do not assume a production base path for client sites until their deployment is explicitly configured.
- Copy only useful prospect assets into the site; preserve source attribution in the brief/manifest.
- Prefer authentic source photography for real projects, completed work, products, people, and premises. Preserve the manifest's source-page groupings and never combine unrelated photos into a fabricated project.
- Prefer authentic, useful prospect imagery. Inspect raster dimensions and judge quality at the image's largest rendered size and crop; never stretch a small image into a pixelated hero, banner, or large panel. For prominent imagery, target roughly two source pixels per rendered CSS pixel on high-density displays. If a local image cannot scale cleanly, reduce its presentation size or use a higher-resolution Unsplash photo with the same subject, mood, or meaning. Treat Unsplash photography as clearly illustrative stock imagery: never imply it depicts the business's actual staff, customers, premises, products, equipment, or work. Preserve photo and photographer source URLs in `site/stock-images.md`, and follow Unsplash API hotlinking and attribution requirements whenever the API is used.
- Install dependencies, run the production build, and fix all failures. The expected output is `site/dist`; if different, write `site/site-output.json` containing `{ "outputDir": "relative/path" }`.

## Repository safety

Infrastructure is isolated under `infrastructure/`. Never modify or adopt an existing AWS resource implicitly. Deployment requires an explicit bucket name supplied by stack output or the operator.

Promoting a prospect creates a client workspace but never authorizes production deployment, DNS changes, analytics, forms, or third-party account configuration.

Approved static client deployments must use the client's explicit `client.json` deployment record and the isolated client infrastructure workflow. Never infer an AWS account, bucket, distribution, certificate, domain, or hosted zone. Client deployment may upload to the recorded client bucket and invalidate the recorded client distribution, but it must never modify nameservers or DNS records automatically.

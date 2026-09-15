# Aderet website generation rules

This repository generates modern replacement websites from factual source material. Each generated website is an independent project under `prospects/<id>/site`.

## Non-negotiable factual accuracy

`prospects/<id>/brief.md` and its cited source pages are the only authority for business facts. Never invent testimonials, reviews, certifications, awards, company history, employee names, pricing, services, service areas, locations, phone numbers, statistics, guarantees, or hours. A missing fact is unknown and must be omitted. Marketing copy may be improved only without adding factual claims.

## Generated site quality

- Treat the existing website as an information source, never as the visual template.
- Design each site from first principles for that business; do not create or reuse a shared template, theme, JSON renderer, or repo-wide component library.
- Produce a responsive, accessible, fast static marketing site with strong mobile treatment, semantic HTML, appropriate SEO metadata, and clear truthful calls to action.
- Prefer React, Vite, and TypeScript. Keep dependencies small.
- Configure the site base path as `/preview/<id>/` and ensure nested paths and assets work there.
- Copy only useful prospect assets into the site; preserve source attribution in the brief/manifest.
- Install dependencies, run the production build, and fix all failures. The expected output is `site/dist`; if different, write `site/site-output.json` containing `{ "outputDir": "relative/path" }`.

## Repository safety

Infrastructure is isolated under `infrastructure/`. Never modify or adopt an existing AWS resource implicitly. Deployment requires an explicit bucket name supplied by stack output or the operator.

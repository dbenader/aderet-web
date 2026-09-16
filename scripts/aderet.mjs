#!/usr/bin/env node
import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { access, cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { load } from 'cheerio';

const root = resolve(import.meta.dirname, '..');
const prospectsRoot = join(root, 'prospects');
const clientsRoot = join(root, 'clients');
const publicRoot = join(root, 'public');
const maxPages = Number(process.env.ADERET_MAX_PAGES || 12);
const maxAssetBytes = 12 * 1024 * 1024;
const userAgent = 'AderetProspectBot/0.1 (+https://aderet.tech; respectful business-site preview crawler)';

const exists = async (path) => access(path).then(() => true).catch(() => false);
const json = (path) => readFile(path, 'utf8').then(JSON.parse);
const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const clean = (value = '') => value.replace(/\s+/g, ' ').trim();
const unique = (items) => [...new Set(items.filter(Boolean))];
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

function usage(message) {
  if (message) console.error(`\nError: ${message}\n`);
  console.error(`Aderet prospect engine

  npm run prospect -- <url> [--no-generate] [--no-deploy]
  npm run crawl -- <url> [--id <id>]
  npm run generate -- <id>
  npm run outreach -- <id>
  npm run validate -- <id>
  npm run deploy -- <id>
  npm run promote -- <prospect-id> --client <client-slug>
  npm run client:provision -- <client-id> [--domain <hostname>]
  npm run client:deploy -- <client-id>
  npm run client:verify -- <client-id>
  npm run deploy:main

Environment: ADERET_BUCKET, ADERET_DISTRIBUTION_ID, ADERET_PUBLIC_URL,
             ADERET_AGENT_COMMAND (defaults to "codex"), ADERET_OUTREACH_SENDER,
             UNSPLASH_ACCESS_KEY (optional), ADERET_CLIENT_AWS_ACCOUNT_ID,
             ADERET_CLIENT_AWS_REGION (defaults to us-east-1)`);
  process.exit(message ? 1 : 0);
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const env = { ...process.env, AWS_PAGER: '', ...(options.env || {}) };
    const child = spawn(command, args, { cwd: options.cwd || root, stdio: options.input ? ['pipe', 'inherit', 'inherit'] : 'inherit', env });
    if (options.input) child.stdin.end(options.input);
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

function runCapture(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const env = { ...process.env, AWS_PAGER: '', ...(options.env || {}) };
    const child = spawn(command, args, { cwd: options.cwd || root, stdio: ['ignore', 'pipe', 'pipe'], env });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun(stdout.trim()) : reject(new Error(`${command} exited with code ${code}: ${clean(stderr)}`)));
  });
}

function normalizeUrl(raw) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  url.hash = '';
  return url;
}

function isInternal(url, startUrl) {
  const hostname = (value) => value.hostname.toLowerCase().replace(/^www\./, '');
  return hostname(url) === hostname(startUrl) && !/\.(pdf|zip|jpe?g|png|gif|webp|svg|mp4|mp3|docx?)$/i.test(url.pathname);
}

function rankLink(url) {
  const path = url.pathname.toLowerCase();
  const useful = ['about', 'service', 'product', 'contact', 'location', 'team', 'company', 'menu', 'work', 'faq'];
  return useful.some((part) => path.includes(part)) ? 0 : path.split('/').length;
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' }, redirect: 'follow', signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    if (!(response.headers.get('content-type') || '').includes('text/html')) throw new Error('not HTML');
    return { html: await response.text(), finalUrl: response.url };
  } finally { clearTimeout(timeout); }
}

function extractPage(html, pageUrl) {
  const $ = load(html);
  $('script,style,noscript,template,svg').remove();
  const title = clean($('title').first().text());
  const description = clean($('meta[name="description"]').attr('content'));
  const headings = unique($('h1,h2,h3').map((_, el) => clean($(el).text())).get()).slice(0, 60);
  const navigation = unique($('nav a,header a').map((_, el) => clean($(el).text())).get()).filter((x) => x.length < 80).slice(0, 40);
  const content = ($('main').length ? $('main') : $('body')).clone();
  content.find('h1,h2,h3,h4,p,li,a,address,section,article,div,br').append(' ');
  const text = clean(content.text()).slice(0, 30000);
  const links = $('a[href]').map((_, el) => { try { return new URL($(el).attr('href'), pageUrl).href; } catch { return ''; } }).get();
  const images = $('img[src],source[srcset]').map((_, el) => {
    const raw = $(el).attr('src') || ($(el).attr('srcset') || '').split(',')[0]?.trim().split(' ')[0];
    try { return { url: new URL(raw, pageUrl).href, alt: clean($(el).attr('alt')), width: Number($(el).attr('width')) || null, height: Number($(el).attr('height')) || null }; } catch { return null; }
  }).get().filter(Boolean);
  const socials = links.filter((link) => /facebook|instagram|linkedin|youtube|tiktok|x\.com|twitter/i.test(link));
  const emails = unique([...html.matchAll(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g)].map((m) => m[0].toLowerCase()));
  const phones = unique([...text.matchAll(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g)].map((m) => clean(m[0])));
  const addressCandidates = unique($('[itemprop="address"],address,.address,[class*="location"]').map((_, el) => clean($(el).text())).get()).filter((x) => x.length > 8 && x.length < 300);
  return { url: pageUrl, title, description, headings, navigation, text, links, images, socials, emails, phones, addressCandidates };
}

async function downloadAssets(items, assetsDir) {
  await mkdir(assetsDir, { recursive: true });
  const manifest = [];
  for (const item of unique(items.map((x) => x.url)).slice(0, 40).map((url) => items.find((x) => x.url === url))) {
    try {
      const response = await fetch(item.url, { headers: { 'user-agent': userAgent }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;
      const length = Number(response.headers.get('content-length') || 0);
      const contentType = response.headers.get('content-type') || '';
      if (length > maxAssetBytes || !/image|font/.test(contentType)) continue;
      const body = Buffer.from(await response.arrayBuffer());
      if (body.length > maxAssetBytes) continue;
      const url = new URL(item.url);
      const inferred = contentType.includes('svg') ? '.svg' : contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : contentType.includes('gif') ? '.gif' : '.jpg';
      const originalExt = extname(url.pathname).toLowerCase();
      const ext = /^\.(png|jpe?g|webp|gif|svg|avif)$/.test(originalExt) ? originalExt : inferred;
      const stem = basename(url.pathname, originalExt).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 55) || 'asset';
      const name = `${stem}-${createHash('sha1').update(item.url).digest('hex').slice(0, 8)}${ext}`;
      await writeFile(join(assetsDir, name), body);
      manifest.push({ sourceUrl: item.url, localPath: `assets/${name}`, alt: item.alt || '', bytes: body.length, contentType });
      process.stdout.write(`  ↓ ${name}\n`);
    } catch (error) { process.stderr.write(`  ! asset skipped: ${item.url} (${error.message})\n`); }
  }
  await writeJson(join(assetsDir, 'manifest.json'), manifest);
  return manifest;
}

function briefFrom(id, sourceUrl, pages, assets) {
  const all = (key) => unique(pages.flatMap((page) => page[key] || []));
  const titles = pages.map((p) => p.title).filter(Boolean);
  const businessName = clean(titles[0]?.split(/[|–—·]/)[0]) || new URL(sourceUrl).hostname.replace(/^www\./, '');
  const pageSections = pages.map((page) => `### ${page.title || page.url}\nSource: ${page.url}\n\n${page.description ? `${page.description}\n\n` : ''}${page.headings.map((h) => `- ${h}`).join('\n')}\n\nVisible copy:\n\n${page.text}`).join('\n\n---\n\n');
  const section = (heading, values) => `## ${heading}\n\n${values.length ? values.map((x) => `- ${x}`).join('\n') : '- Not found on source site.'}`;
  return { businessName, markdown: `# Business brief: ${businessName}\n\n> Generated from the source website on ${new Date().toISOString()}. Every claim must remain traceable to a URL below. Missing information is unknown—not permission to invent it.\n\n## Identity\n\n- Prospect ID: ${id}\n- Original URL: ${sourceUrl}\n- Crawled pages: ${pages.length}\n- Downloaded assets: ${assets.length}\n\n${section('Phone numbers', all('phones'))}\n\n${section('Email addresses', all('emails'))}\n\n${section('Addresses / location text', all('addressCandidates'))}\n\n${section('Social profiles', all('socials'))}\n\n${section('Navigation labels', all('navigation'))}\n\n## Local assets\n\n${assets.length ? assets.map((asset) => `- \`${asset.localPath}\` — from ${asset.sourceUrl}${asset.alt ? ` — alt: ${asset.alt}` : ''}`).join('\n') : '- No suitable image assets were downloaded.'}\n\n## Source pages and copy\n\n${pageSections}\n` };
}

async function crawl(rawUrl, forcedId) {
  const start = normalizeUrl(rawUrl);
  const id = forcedId || randomBytes(3).toString('hex');
  const dir = join(prospectsRoot, id);
  if (await exists(dir) && !forcedId) throw new Error(`prospect ${id} already exists`);
  await mkdir(join(dir, 'source', 'pages'), { recursive: true });
  const queue = [start.href]; const seen = new Set(); const pages = [];
  console.log(`\nCrawling ${start.href} as ${id}`);
  while (queue.length && pages.length < maxPages) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);
    try {
      console.log(`  ${pages.length + 1}/${maxPages} ${current}`);
      const { html, finalUrl } = await fetchPage(current);
      const page = extractPage(html, finalUrl);
      pages.push(page);
      await writeFile(join(dir, 'source', 'pages', `${String(pages.length).padStart(2, '0')}.html`), html);
      const candidates = unique(page.links.map((link) => { try { const url = normalizeUrl(link); url.search = ''; return url; } catch { return null; } }).filter((url) => url && isInternal(url, start)).map((url) => url.href));
      queue.push(...candidates.sort((a, b) => rankLink(new URL(a)) - rankLink(new URL(b))).filter((url) => !seen.has(url)));
      await sleep(150);
    } catch (error) { console.error(`  ! skipped ${current}: ${error.message}`); }
  }
  if (!pages.length) throw new Error('No pages could be crawled. The site may block automated access or may not return HTML.');
  const assets = await downloadAssets(pages.flatMap((page) => page.images), join(dir, 'assets'));
  const brief = briefFrom(id, start.href, pages, assets);
  await writeFile(join(dir, 'brief.md'), brief.markdown);
  await writeJson(join(dir, 'source', 'crawl.json'), pages);
  await writeJson(join(dir, 'prospect.json'), { id, businessName: brief.businessName, sourceUrl: start.href, status: 'crawled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  console.log(`\n✓ Crawled ${pages.length} pages\n✓ Downloaded ${assets.length} assets\n✓ Generated ${relative(root, join(dir, 'brief.md'))}`);
  return id;
}

function generationPrompt(id) {
  return `Build a complete standalone static marketing website for prospect ${id}.\n\nRead ../brief.md as the sole source of business facts. Read ../assets/manifest.json and evaluate the local assets in ../assets/; use the ones that are relevant and visually strong. Work only in the current site directory. Create the project yourself—do not use a repo-wide template or shared component library. Prefer React + Vite + TypeScript unless the brief clearly suggests an even simpler static implementation.\n\nEvaluate every raster image against its largest intended rendered size and crop, not just its thumbnail appearance. Inspect its pixel dimensions before use. Do not upscale an image beyond its native resolution; for prominent hero, banner, and full-bleed imagery, target roughly two source pixels per rendered CSS pixel on high-density displays and verify that object-fit cropping still leaves enough usable detail. Use responsive image sizes where appropriate. If an otherwise relevant local image will look soft or pixelated in its assigned layout, either give it a smaller presentation or replace it with a higher-resolution Unsplash image that conveys the same subject, mood, or meaning.\n\nIf the supplied imagery is low-resolution, poorly composed, visibly dated, watermarked, irrelevant, or insufficient for a polished design, source suitable stock photography from Unsplash. Use stock only as illustrative mood or category imagery: never present it as the prospect's actual staff, customers, premises, products, equipment, or completed work, and avoid visible third-party branding. Prefer specific, business-relevant search terms over generic corporate imagery. If UNSPLASH_ACCESS_KEY is available, use the official Unsplash API, keep the credential secret, use the image URLs returned by the API as required by Unsplash hotlinking rules, and provide visible photographer and Unsplash attribution with referral links. If the key is unavailable, you may select images from public Unsplash pages, preserve the photo and photographer source URLs, and include appropriate attribution. Record every stock image used, its photo page URL, and its photographer in stock-images.md. Do not use unstable source.unsplash.com random-image URLs.\n\nThe redesign must be distinctive, polished, responsive, accessible, fast, SEO-ready, and strongly optimized for the business's real conversion goal. You may rewrite and reorganize source copy, but never invent services, testimonials, reviews, certifications, awards, history, people, prices, locations, contact details, statistics, guarantees, or hours. When a fact is absent, omit it. Preserve factual traceability.\n\nThe deployed URL will be /preview/${id}/, so configure the build for that base path and make all local routes/assets work under it. Copy any used downloaded prospect assets into the site project. Run dependency installation and the production build. Fix every build error before finishing. Ensure the production artifact is site/dist (or document another output in site-output.json).`;
}

function outreachPrompt(id, previewUrl) {
  const sender = clean(process.env.ADERET_OUTREACH_SENDER || '[Your name] from Aderet');
  return `Create tailored cold-outreach copy for prospect ${id}.

Read brief.md as the sole source of business facts. Review the generated website in site/ so you understand the design concept and its likely value to this particular business. Write only outreach.md in the current directory; do not modify the site or any other file.

The outreach is from ${sender}. The preview URL is ${previewUrl}.

Write outreach.md with exactly this structure:

# Outreach

## Text message

One copy-ready text message.

## Email

### Subject

One subject line.

### Body

One copy-ready email.

## Personalization notes

A short private bullet list explaining the real business details and website opportunities used to tailor the copy. Include the supporting source URL for each factual detail. These notes are not part of the message sent to the prospect.

Requirements:
- Make both messages specific to this business and its likely customer journey, not a generic web-design pitch.
- Lead with genuine relevance and the fact that a working concept was prepared. Include the preview URL in both messages.
- Keep the text message at or below 320 characters, including the sender identification and a brief, natural opt-out such as "If you'd rather I not text, just say so."
- Keep the email body between 80 and 150 words. Use a short, natural subject line.
- Use [First name] when the decision-maker's name is not explicitly supported by the brief. Do not guess a person's name.
- Be respectful, conversational, and low-pressure. Use one simple call to action.
- Never invent business facts, performance problems, traffic, conversion results, customer reactions, prior contact, urgency, discounts, or promises.
- Do not insult or disparage the existing website. Frame the redesign around a concrete opportunity visible in the sourced material.
- Do not describe the concept as commissioned, approved, or already owned by the prospect.
- Do not add legal or compliance claims. The human sender must review the copy before use.`;
}

async function generateOutreach(id) {
  assertProspectId(id);
  const dir = join(prospectsRoot, id);
  if (!await exists(join(dir, 'brief.md'))) throw new Error(`Unknown prospect: ${id}`);
  if (!await exists(join(dir, 'site', 'package.json'))) throw new Error(`No generated site for ${id}`);
  const prospect = await json(join(dir, 'prospect.json'));
  const publicUrl = (process.env.ADERET_PUBLIC_URL || 'https://aderet.tech').replace(/\/$/, '');
  const previewUrl = prospect.previewUrl || `${publicUrl}/preview/${id}/`;
  const prompt = outreachPrompt(id, previewUrl);
  await writeFile(join(dir, 'outreach-prompt.md'), prompt);
  const command = process.env.ADERET_AGENT_COMMAND || 'codex';
  console.log(`\nDirecting ${command} to write outreach for ${id}…`);
  await run(command, ['exec', '--approve-for-me', '-C', dir, '-'], { cwd: dir, input: prompt });

  const outputPath = join(dir, 'outreach.md');
  if (!await exists(outputPath)) throw new Error('Agent finished without creating outreach.md.');
  const output = await readFile(outputPath, 'utf8');
  for (const heading of ['# Outreach', '## Text message', '## Email', '### Subject', '### Body', '## Personalization notes']) {
    if (!output.split('\n').some((line) => line.trim() === heading)) throw new Error(`outreach.md is missing required heading: ${heading}`);
  }
  if (!output.includes(previewUrl)) throw new Error(`outreach.md must include the preview URL: ${previewUrl}`);
  const textMessage = output.match(/## Text message\s+([\s\S]*?)(?=\n## Email)/)?.[1]?.trim() || '';
  if (!textMessage || clean(textMessage).length > 320) throw new Error('Text message must be present and no longer than 320 characters.');
  const emailBody = output.match(/### Body\s+([\s\S]*?)(?=\n## Personalization notes)/)?.[1]?.trim() || '';
  const emailWordCount = clean(emailBody).split(' ').filter(Boolean).length;
  if (emailWordCount < 80 || emailWordCount > 150) throw new Error('Email body must be between 80 and 150 words.');
  if (!textMessage.includes(previewUrl) || !emailBody.includes(previewUrl)) throw new Error('Both outreach messages must include the preview URL.');

  const generatedAt = new Date().toISOString();
  await updateMeta(id, { outreachFile: 'outreach.md', outreachGeneratedAt: generatedAt });
  console.log(`✓ Outreach generated: ${relative(root, outputPath)}`);
  return outputPath;
}

async function generate(id) {
  const dir = join(prospectsRoot, id); const site = join(dir, 'site');
  if (!await exists(join(dir, 'brief.md'))) throw new Error(`Unknown prospect: ${id}`);
  await mkdir(site, { recursive: true });
  const prompt = generationPrompt(id);
  await writeFile(join(dir, 'generation-prompt.md'), prompt);
  const command = process.env.ADERET_AGENT_COMMAND || 'codex';
  console.log(`\nDirecting ${command} in ${relative(root, site)}…`);
  await run(command, ['exec', '--approve-for-me', '-C', site, '-'], { cwd: site, input: prompt });
  await generateOutreach(id);
  await updateMeta(id, { status: 'generated' });
  console.log('✓ Agent generation complete');
}

async function getSiteOutputDir(site) {
  if (await exists(join(site, 'site-output.json'))) {
    const config = await json(join(site, 'site-output.json'));
    const output = resolve(site, config.outputDir);
    const relativeOutput = relative(site, output);
    if (!relativeOutput || relativeOutput === '..' || relativeOutput.startsWith(`..${sep}`) || isAbsolute(relativeOutput)) throw new Error('site-output.json outputDir must stay inside the site directory.');
    return output;
  }
  for (const name of ['dist', 'out', 'build']) if (await exists(join(site, name))) return join(site, name);
  return null;
}

async function getOutputDir(id) {
  return getSiteOutputDir(join(prospectsRoot, id, 'site'));
}

async function validate(id) {
  const site = join(prospectsRoot, id, 'site');
  if (!await exists(join(site, 'package.json'))) throw new Error(`No generated site for ${id}`);
  console.log(`\nBuilding prospect ${id}…`);
  await run('npm', [(await exists(join(site, 'package-lock.json'))) ? 'ci' : 'install'], { cwd: site });
  await run('npm', ['run', 'build'], { cwd: site });
  const output = await getOutputDir(id);
  if (!output || !await exists(join(output, 'index.html'))) throw new Error('Build succeeded but no index.html was found in dist/, out/, or build/.');
  const files = await walk(output);
  const html = await readFile(join(output, 'index.html'), 'utf8');
  const previewPrefix = new RegExp(`^/preview/${id}/?`);
  const missing = [...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)]
    .map((m) => m[1])
    .filter((ref) => !/^(?:https?:|mailto:|tel:|data:|\/\/)/.test(ref))
    .map((ref) => ref.replace(previewPrefix, '').replace(/^\.\//, '').replace(/^\//, ''))
    .filter(Boolean)
    .filter((ref) => !files.has(ref) && !files.has(`${ref.replace(/\/$/, '')}/index.html`));
  if (missing.length) throw new Error(`Broken local references: ${unique(missing).join(', ')}`);
  await writeJson(join(prospectsRoot, id, 'validation.json'), { valid: true, checkedAt: new Date().toISOString(), outputDir: relative(site, output), files: files.size });
  await updateMeta(id, { status: 'validated' });
  console.log(`✓ Build valid (${files.size} files in ${relative(root, output)})`);
  return output;
}

async function walk(dir, base = dir, result = new Set()) {
  for (const name of await readdir(dir)) { const path = join(dir, name); const info = await stat(path); if (info.isDirectory()) await walk(path, base, result); else result.add(relative(base, path)); }
  return result;
}

async function updateMeta(id, changes) {
  const path = join(prospectsRoot, id, 'prospect.json'); const current = await json(path);
  await writeJson(path, { ...current, ...changes, updatedAt: new Date().toISOString() });
}

function flagValue(flags, name) {
  const index = flags.indexOf(name);
  if (index === -1) return null;
  const value = flags[index + 1];
  if (!value || value.startsWith('--')) usage(`${name} needs a value`);
  return value;
}

function assertClientId(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '') || id.length > 48) {
    throw new Error('Client slug must be at most 48 characters and contain lowercase letters, numbers, and single hyphens only.');
  }
}

function assertProspectId(id) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id || '')) throw new Error('Invalid prospect ID.');
}

async function copyClientSite(source, destination) {
  const excluded = new Set(['node_modules', 'dist', 'build', 'out', '.vite', '.next']);
  await cp(source, destination, {
    recursive: true,
    filter: (path) => {
      if (path === source) return true;
      const [topLevel] = relative(source, path).split(/[\\/]/);
      return !excluded.has(topLevel);
    }
  });
}

async function promote(prospectId, clientId) {
  assertProspectId(prospectId);
  assertClientId(clientId);
  const prospectDir = join(prospectsRoot, prospectId);
  const prospectMetaPath = join(prospectDir, 'prospect.json');
  const sourceSite = join(prospectDir, 'site');
  if (!await exists(prospectMetaPath) || !await exists(join(prospectDir, 'brief.md'))) throw new Error(`Unknown prospect: ${prospectId}`);
  if (!await exists(join(sourceSite, 'package.json'))) throw new Error(`No generated site for ${prospectId}`);

  const clientDir = join(clientsRoot, clientId);
  if (await exists(clientDir)) {
    const clientMetaPath = join(clientDir, 'client.json');
    if (await exists(clientMetaPath)) {
      const existingClient = await json(clientMetaPath);
      if (existingClient.sourceProspectId === prospectId) {
        await updateMeta(prospectId, { status: 'won', clientId, convertedAt: existingClient.promotedAt });
        console.log(`\n✓ Client ${clientId} already exists; repaired prospect link if needed.`);
        return clientId;
      }
    }
    throw new Error(`Client already exists: ${clientId}`);
  }

  await validate(prospectId);
  const prospect = await json(prospectMetaPath);
  const promotedAt = new Date().toISOString();
  const stagingDir = join(clientsRoot, `.${clientId}.promoting-${randomBytes(4).toString('hex')}`);
  await mkdir(clientsRoot, { recursive: true });

  try {
    await mkdir(join(stagingDir, 'intake'), { recursive: true });
    await mkdir(join(stagingDir, 'facts'), { recursive: true });
    await copyClientSite(sourceSite, join(stagingDir, 'site'));

    for (const name of ['brief.md', 'source', 'assets', 'generation-prompt.md', 'outreach-prompt.md', 'outreach.md', 'validation.json', 'prospect.json']) {
      const source = join(prospectDir, name);
      if (await exists(source)) await cp(source, join(stagingDir, 'intake', name), { recursive: true });
    }

    await writeJson(join(stagingDir, 'client.json'), {
      id: clientId,
      businessName: prospect.businessName,
      status: 'onboarding',
      sourceProspectId: prospectId,
      sourceUrl: prospect.sourceUrl,
      promotedAt,
      updatedAt: promotedAt,
      deployment: { status: 'unconfigured' }
    });
    await writeFile(join(stagingDir, 'README.md'), `# ${prospect.businessName}\n\nPromoted from prospect \`${prospectId}\` on ${promotedAt}.\n\n- \`intake/\` is the frozen prospect evidence and generation record.\n- \`facts/\` is for client-approved facts and content supplied after conversion.\n- \`site/\` is the ongoing production website project.\n- Production hosting, domain configuration, forms, analytics, and the site base path remain unconfigured until explicitly approved.\n\nAfter approval, start isolated production provisioning from the repository root with:\n\n\`\`\`bash\nnpm run client:provision -- ${clientId} --domain www.example.com\n\`\`\`\n`);
    await writeFile(join(stagingDir, 'facts', 'README.md'), '# Client-approved facts\n\nPlace client-provided and explicitly approved factual material here. Record its source and approval date. Do not treat drafts, assumptions, or uncited marketing ideas as business facts.\n');
    await rename(stagingDir, clientDir);
  } catch (error) {
    await rm(stagingDir, { recursive: true, force: true });
    throw error;
  }

  await updateMeta(prospectId, { status: 'won', clientId, convertedAt: promotedAt });
  console.log(`\n✓ Promoted prospect ${prospectId} to client ${clientId}\n✓ Client workspace: ${relative(root, clientDir)}\n\nProduction deployment remains unconfigured.`);
  return clientId;
}

function assertDomainName(domain) {
  if (!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domain || '')) {
    throw new Error('Domain must be a lowercase hostname such as www.example.com.');
  }
}

async function updateClientMeta(id, changes) {
  const path = join(clientsRoot, id, 'client.json');
  const current = await json(path);
  const next = { ...current, ...changes, updatedAt: new Date().toISOString() };
  await writeJson(path, next);
  return next;
}

async function clientRecord(id) {
  assertClientId(id);
  const path = join(clientsRoot, id, 'client.json');
  if (!await exists(path)) throw new Error(`Unknown client: ${id}`);
  return json(path);
}

async function awsIdentity() {
  const expectedAccount = process.env.ADERET_CLIENT_AWS_ACCOUNT_ID;
  if (!expectedAccount) throw new Error('ADERET_CLIENT_AWS_ACCOUNT_ID is required before provisioning or deploying client infrastructure.');
  const identity = JSON.parse(await runCapture('aws', ['sts', 'get-caller-identity', '--output', 'json']));
  if (identity.Account !== expectedAccount) throw new Error(`AWS account mismatch: expected ${expectedAccount}, but the active credentials use ${identity.Account}.`);
  return identity;
}

function certificateValidationRecords(certificate) {
  const records = (certificate.DomainValidationOptions || []).flatMap((option) => option.ResourceRecord ? [{
    domain: option.DomainName,
    type: option.ResourceRecord.Type,
    name: option.ResourceRecord.Name,
    value: option.ResourceRecord.Value
  }] : []);
  return records.filter((record, index) => records.findIndex((candidate) => candidate.name === record.name && candidate.value === record.value) === index);
}

async function describeCertificate(arn) {
  const output = await runCapture('aws', ['acm', 'describe-certificate', '--certificate-arn', arn, '--region', 'us-east-1', '--output', 'json']);
  return JSON.parse(output).Certificate;
}

async function clientProvision(id, requestedDomain) {
  const client = await clientRecord(id);
  const identity = await awsIdentity();
  const existing = client.deployment || {};
  if (existing.provider && existing.provider !== 'aws') throw new Error(`Client is already configured for deployment provider ${existing.provider}.`);
  if (existing.awsAccountId && existing.awsAccountId !== identity.Account) throw new Error(`Client infrastructure belongs to AWS account ${existing.awsAccountId}, not ${identity.Account}.`);
  const domain = requestedDomain || existing.domain;
  if (!domain) throw new Error('First run requires --domain <hostname>, preferably www.example.com.');
  assertDomainName(domain);
  if (existing.domain && requestedDomain && existing.domain !== requestedDomain) {
    throw new Error(`Client is already configured for ${existing.domain}; refusing to switch domains implicitly.`);
  }

  const stackRegion = process.env.ADERET_CLIENT_AWS_REGION || 'us-east-1';
  const stackName = existing.stackName || `aderet-client-${id}`;
  let certificateArn = existing.certificateArn;
  if (!certificateArn) {
    const token = createHash('sha256').update(`${identity.Account}:${domain}`).digest('hex').slice(0, 32);
    const result = JSON.parse(await runCapture('aws', [
      'acm', 'request-certificate', '--region', 'us-east-1', '--domain-name', domain,
      '--validation-method', 'DNS', '--idempotency-token', token,
      '--options', 'CertificateTransparencyLoggingPreference=ENABLED',
      '--tags', `Key=ClientId,Value=${id}`, 'Key=ManagedBy,Value=Aderet', '--output', 'json'
    ]));
    certificateArn = result.CertificateArn;
  }

  const certificate = await describeCertificate(certificateArn);
  const validationRecords = certificateValidationRecords(certificate);
  const deployment = {
    ...existing,
    provider: 'aws',
    awsAccountId: identity.Account,
    region: stackRegion,
    dnsMode: 'external',
    domain,
    stackName,
    certificateArn,
    certificateStatus: certificate.Status,
    validationRecords,
    status: certificate.Status === 'ISSUED' ? 'provisioning' : 'awaiting_certificate_validation'
  };
  await updateClientMeta(id, { deployment });

  if (certificate.Status !== 'ISSUED') {
    if (['FAILED', 'EXPIRED', 'REVOKED'].includes(certificate.Status)) throw new Error(`Certificate cannot be used: ${certificate.Status}${certificate.FailureReason ? ` (${certificate.FailureReason})` : ''}`);
    console.log(`\nCertificate status: ${certificate.Status}`);
    if (validationRecords.length) {
      console.log('\nAdd this DNS validation record without changing any existing website or email records:');
      for (const record of validationRecords) {
        console.log(`\n  Type:  ${record.type}\n  Name:  ${record.name}\n  Value: ${record.value}`);
        if (domain.startsWith('www.')) {
          const apex = domain.slice(4);
          const fullName = record.name.replace(/\.$/, '');
          const providerName = fullName.endsWith(`.${apex}`) ? fullName.slice(0, -1 * (`.${apex}`.length)) : fullName;
          console.log(`  GoDaddy Name field: ${providerName}`);
        }
      }
    } else {
      console.log('\nAWS has not published the validation record yet. Run this command again in a minute.');
    }
    console.log(`\nAfter DNS validation succeeds, rerun:\n  npm run client:provision -- ${id}`);
    return;
  }

  console.log(`\nCertificate issued. Provisioning isolated AWS resources for ${id}…`);
  await run('aws', [
    'cloudformation', 'deploy', '--region', stackRegion,
    '--stack-name', stackName,
    '--template-file', join(root, 'infrastructure', 'client-static-site.yaml'),
    '--parameter-overrides', `ClientId=${id}`, `DomainName=${domain}`, `CertificateArn=${certificateArn}`,
    '--no-fail-on-empty-changeset'
  ]);
  const rawOutputs = await runCapture('aws', [
    'cloudformation', 'describe-stacks', '--region', stackRegion, '--stack-name', stackName,
    '--query', 'Stacks[0].Outputs', '--output', 'json'
  ]);
  const outputs = Object.fromEntries(JSON.parse(rawOutputs).map((output) => [output.OutputKey, output.OutputValue]));
  const readyDeployment = {
    ...deployment,
    certificateStatus: 'ISSUED',
    status: 'ready_to_deploy',
    bucket: outputs.BucketName,
    distributionId: outputs.DistributionId,
    distributionDomain: outputs.DistributionDomainName,
    productionUrl: outputs.ProductionUrl,
    provisionedAt: new Date().toISOString()
  };
  await updateClientMeta(id, { deployment: readyDeployment });
  console.log(`\n✓ Infrastructure ready\n\nDeploy content before changing the live DNS record:\n  npm run client:deploy -- ${id}\n\nAfter deployment, the website DNS cutover will be:\n\n  Type:  CNAME\n  Name:  ${domain}\n  Value: ${outputs.DistributionDomainName}`);
  if (domain.startsWith('www.')) console.log('  GoDaddy Name field: www');
  if (domain.startsWith('www.')) console.log(`\nFor ${domain.slice(4)}, configure a permanent HTTPS redirect to ${outputs.ProductionUrl} after the CNAME is live.`);
}

async function clientDeploy(id) {
  const client = await clientRecord(id);
  const identity = await awsIdentity();
  const deployment = client.deployment || {};
  if (deployment.awsAccountId && deployment.awsAccountId !== identity.Account) throw new Error(`Client infrastructure belongs to AWS account ${deployment.awsAccountId}, not ${identity.Account}.`);
  if (!deployment.bucket || !deployment.distributionId || !deployment.domain) {
    throw new Error(`Client infrastructure is not ready. Run: npm run client:provision -- ${id}`);
  }

  const site = join(clientsRoot, id, 'site');
  if (!await exists(join(site, 'package.json'))) throw new Error(`No client site for ${id}`);
  const packageJson = await json(join(site, 'package.json'));
  console.log(`\nBuilding ${id} for production at / …`);
  await run('npm', [(await exists(join(site, 'package-lock.json'))) ? 'ci' : 'install'], { cwd: site });
  const buildArgs = ['run', 'build'];
  if (/\bvite\b/.test(packageJson.scripts?.build || '')) buildArgs.push('--', '--base=/');
  await run('npm', buildArgs, { cwd: site, env: { VITE_BASE_PATH: '/' } });
  const output = await getSiteOutputDir(site);
  if (!output || !await exists(join(output, 'index.html'))) throw new Error('Production build succeeded but no index.html was found in dist/, out/, or build/.');
  const html = await readFile(join(output, 'index.html'), 'utf8');
  if (/\/preview\/[a-zA-Z0-9_-]+\//.test(html)) throw new Error('Production build still references a prospect /preview/<id>/ base path. Update the site build configuration to accept a root base path.');
  const files = await walk(output);
  const missing = [...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)]
    .map((match) => match[1])
    .filter((ref) => !/^(?:https?:|mailto:|tel:|data:|\/\/)/.test(ref))
    .map((ref) => ref.replace(/^\.\//, '').replace(/^\//, ''))
    .filter(Boolean)
    .filter((ref) => !files.has(ref) && !files.has(`${ref.replace(/\/$/, '')}/index.html`));
  if (missing.length) throw new Error(`Broken production references: ${unique(missing).join(', ')}`);

  await run('aws', ['s3', 'sync', `${output}/`, `s3://${deployment.bucket}/`, '--region', deployment.region || 'us-east-1', '--delete', '--only-show-errors']);
  await run('aws', ['cloudfront', 'create-invalidation', '--region', 'us-east-1', '--distribution-id', deployment.distributionId, '--paths', '/*']);
  const deployedAt = new Date().toISOString();
  const indexSha256 = createHash('sha256').update(html).digest('hex');
  await updateClientMeta(id, { status: 'deployment_pending_dns', deployment: { ...deployment, status: 'deployed_awaiting_dns', deployedAt, indexSha256 } });
  console.log(`\n✓ Client content deployed\n\nProduction URL after DNS cutover: https://${deployment.domain}\nCloudFront target: ${deployment.distributionDomain}\n\nReview the existing DNS zone and point only the website CNAME to the CloudFront target above. Then verify with:\n  npm run client:verify -- ${id}`);
}

async function clientVerify(id) {
  const client = await clientRecord(id);
  const deployment = client.deployment || {};
  if (!deployment.domain || !deployment.indexSha256) throw new Error(`Client has no deployment to verify. Run: npm run client:deploy -- ${id}`);
  assertDomainName(deployment.domain);
  const url = `https://${deployment.domain}/?aderet_verify=${Date.now()}`;
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`Production verification returned HTTP ${response.status} from ${url}`);
  const html = await response.text();
  const receivedSha256 = createHash('sha256').update(html).digest('hex');
  if (receivedSha256 !== deployment.indexSha256) {
    throw new Error(`The custom domain is not serving the deployed client build yet. Expected index hash ${deployment.indexSha256.slice(0, 12)}, received ${receivedSha256.slice(0, 12)}.`);
  }
  const verifiedAt = new Date().toISOString();
  await updateClientMeta(id, { status: 'active', deployment: { ...deployment, status: 'active', verifiedAt } });
  console.log(`\n✓ Production verified and client marked active\n\nhttps://${deployment.domain}/`);
}

function awsConfig() {
  const bucket = process.env.ADERET_BUCKET; if (!bucket) throw new Error('ADERET_BUCKET is required. Use the isolated stack output; never point this at an existing production bucket casually.');
  return { bucket, distribution: process.env.ADERET_DISTRIBUTION_ID, publicUrl: (process.env.ADERET_PUBLIC_URL || 'https://aderet.tech').replace(/\/$/, '') };
}

async function deploy(id) {
  const config = awsConfig(); const output = await getOutputDir(id) || await validate(id);
  await run('aws', ['s3', 'sync', `${output}/`, `s3://${config.bucket}/preview/${id}/`, '--delete', '--only-show-errors']);
  if (config.distribution) await run('aws', ['cloudfront', 'create-invalidation', '--distribution-id', config.distribution, '--paths', `/preview/${id}/*`]);
  const previewUrl = `${config.publicUrl}/preview/${id}/`;
  await updateMeta(id, { status: 'deployed', previewUrl });
  console.log(`✓ Deployed\n\nPreview: ${previewUrl}`);
}

async function deployMain() {
  const config = awsConfig();
  await run('npm', ['run', 'build']);
  await run('aws', ['s3', 'sync', `${join(root, 'dist')}/`, `s3://${config.bucket}/`, '--delete', '--exclude', 'preview/*', '--only-show-errors']);
  if (config.distribution) await run('aws', ['cloudfront', 'create-invalidation', '--distribution-id', config.distribution, '--paths', '/', '/index.html', '/assets/*', '/prospects.json']);
  console.log(`✓ Main dashboard deployed to ${config.publicUrl}`);
}

async function indexProspects() {
  await mkdir(publicRoot, { recursive: true }); await mkdir(prospectsRoot, { recursive: true });
  const records = [];
  for (const name of await readdir(prospectsRoot)) { const path = join(prospectsRoot, name, 'prospect.json'); if (await exists(path)) records.push(await json(path)); }
  records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  await writeJson(join(publicRoot, 'prospects.json'), records);
  console.log(`Indexed ${records.length} prospect${records.length === 1 ? '' : 's'}.`);
}

async function main() {
  const [command, value, ...flags] = process.argv.slice(2);
  if (!command || ['help', '--help', '-h'].includes(command)) usage();
  if (command === 'index') return indexProspects();
  if (command === 'crawl') { if (!value) usage('crawl needs a URL'); return crawl(value, flags[flags.indexOf('--id') + 1]); }
  if (!value && command !== 'deploy-main') usage(`${command} needs a URL or prospect ID`);
  if (command === 'generate') return generate(value);
  if (command === 'outreach') return generateOutreach(value);
  if (command === 'validate') return validate(value);
  if (command === 'deploy') return deploy(value);
  if (command === 'promote') return promote(value, flagValue(flags, '--client'));
  if (command === 'client:provision') return clientProvision(value, flagValue(flags, '--domain'));
  if (command === 'client:deploy') return clientDeploy(value);
  if (command === 'client:verify') return clientVerify(value);
  if (command === 'deploy-main') return deployMain();
  if (command === 'prospect') {
    const id = await crawl(value);
    if (!flags.includes('--no-generate')) { await generate(id); await validate(id); }
    if (!flags.includes('--no-deploy')) await deploy(id);
    else console.log(`\nProspect: ${id}\nDeploy later with: npm run deploy -- ${id}`);
    return;
  }
  usage(`Unknown command: ${command}`);
}

main().catch((error) => { console.error(`\n✗ ${error.message}`); process.exitCode = 1; });

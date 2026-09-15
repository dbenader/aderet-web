#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { access, cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { load } from 'cheerio';

const root = resolve(import.meta.dirname, '..');
const prospectsRoot = join(root, 'prospects');
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
  npm run validate -- <id>
  npm run deploy -- <id>
  npm run deploy:main

Environment: ADERET_BUCKET, ADERET_DISTRIBUTION_ID, ADERET_PUBLIC_URL,
             ADERET_AGENT_COMMAND (defaults to "codex")`);
  process.exit(message ? 1 : 0);
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: options.cwd || root, stdio: options.input ? ['pipe', 'inherit', 'inherit'] : 'inherit', env: process.env });
    if (options.input) child.stdin.end(options.input);
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}`)));
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
  return `Build a complete standalone static marketing website for prospect ${id}.\n\nRead ../brief.md as the sole source of business facts. Read ../assets/manifest.json and use useful local assets from ../assets/. Work only in the current site directory. Create the project yourself—do not use a repo-wide template or shared component library. Prefer React + Vite + TypeScript unless the brief clearly suggests an even simpler static implementation.\n\nThe redesign must be distinctive, polished, responsive, accessible, fast, SEO-ready, and strongly optimized for the business's real conversion goal. You may rewrite and reorganize source copy, but never invent services, testimonials, reviews, certifications, awards, history, people, prices, locations, contact details, statistics, guarantees, or hours. When a fact is absent, omit it. Preserve factual traceability.\n\nThe deployed URL will be /preview/${id}/, so configure the build for that base path and make all local routes/assets work under it. Copy used downloaded assets into the site project. Run dependency installation and the production build. Fix every build error before finishing. Ensure the production artifact is site/dist (or document another output in site-output.json).`;
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
  await updateMeta(id, { status: 'generated' });
  console.log('✓ Agent generation complete');
}

async function getOutputDir(id) {
  const site = join(prospectsRoot, id, 'site');
  if (await exists(join(site, 'site-output.json'))) { const config = await json(join(site, 'site-output.json')); return resolve(site, config.outputDir); }
  for (const name of ['dist', 'out', 'build']) if (await exists(join(site, name))) return join(site, name);
  return null;
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
  if (command === 'validate') return validate(value);
  if (command === 'deploy') return deploy(value);
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

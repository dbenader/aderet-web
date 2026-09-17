import assert from 'node:assert/strict';
import test from 'node:test';
import { buildUrlInventory, classifyUrlCandidate, discoveryFrom, extractPage, generationPrompt, initialBuildPlan, isInternal, planDiscoveryCrawl, rankLink, visitorMetaLanguage } from '../scripts/aderet.mjs';

test('prefers original high-resolution image candidates and detects gallery-rich services', () => {
  const images = Array.from({ length: 8 }, (_, index) => `<img src="https://example.com/uploads/kitchen-${index}-600x300.jpg" srcset="https://example.com/uploads/kitchen-${index}-300x150.jpg 300w, https://example.com/uploads/kitchen-${index}-1600x900.jpg 1600w" alt="Kitchen ${index}">`).join('');
  const html = `<html><head><title>Kitchen Remodeling</title></head><body><h1>Kitchen Remodeling</h1>${images}</body></html>`;
  const page = extractPage(html, 'https://example.com/kitchen-remodeling/');

  assert.equal(page.pageType, 'service-gallery');
  assert.equal(page.images.length, 8);
  assert.equal(page.images[0].width, 1600);
  assert.equal(page.images[0].url, 'https://example.com/uploads/kitchen-0.jpg');
  assert.equal(page.images[0].sourcePageUrl, 'https://example.com/kitchen-remodeling/');
});

test('prioritizes projects and makes a small portfolio site complete by default', () => {
  const html = `<html><head><title>Remodeling</title></head><body><h1>Our Work</h1><a href="/projects-oak-drive/">Oak Drive</a><a href="/projects-pine-drive/">Pine Drive</a></body></html>`;
  const page = extractPage(html, 'https://example.com/remodeling/');
  const discovery = discoveryFrom('abc123', 'https://example.com/', [page], 3);
  const plan = initialBuildPlan(discovery);

  assert.ok(rankLink(new URL('https://example.com/projects-oak-drive/')) < rankLink(new URL('https://example.com/blog/post/')));
  assert.ok(discovery.counts.projects >= 2);
  assert.equal(discovery.sourceScale, 'small');
  assert.equal(discovery.recommendation.requiresDecision, false);
  assert.equal(plan.includeProjects, true);
  assert.equal(plan.siteStructure, 'complete-multi-page-rebuild');
  assert.equal(plan.contentCoverage, 'all-meaningful-content');
});

test('excludes CMS media wrappers and asks for a completeness choice on large sites', () => {
  const start = new URL('https://example.com/');
  assert.equal(isInternal(new URL('https://example.com/projects/oak-drive/'), start), true);
  assert.equal(isInternal(new URL('https://example.com/projects/oak-drive/attachment/img_123/'), start), false);
  assert.equal(isInternal(new URL('https://example.com/wp-content/uploads/photo.jpg'), start), false);
  assert.equal(isInternal(new URL('https://example.com/tag/remodeling/'), start), false);

  const page = extractPage('<html><head><title>Services</title></head><body><h1>Construction Services</h1></body></html>', 'https://example.com/services/');
  const discovery = discoveryFrom('large1', 'https://example.com/', [page], 40);
  assert.equal(discovery.sourceScale, 'large');
  assert.equal(discovery.recommendation.requiresDecision, true);
  assert.equal(discovery.recommendation.contentCoverage, 'all-core-content-curated-long-tail');
});

test('categorizes URL families and samples repetitive collections without skipping core pages', () => {
  const start = new URL('https://example.com/');
  const urls = [
    'https://example.com/',
    'https://example.com/about/',
    'https://example.com/contact/',
    'https://example.com/kitchen-remodeling/',
    ...Array.from({ length: 8 }, (_, index) => `https://example.com/kitchen-remodeling/guide-${index}/`),
    ...Array.from({ length: 6 }, (_, index) => `https://example.com/service-areas/city-${index}-ca/`),
    'https://example.com/projects/oak-drive/',
    'https://example.com/privacy-policy/'
  ];
  const inventory = buildUrlInventory(urls, start, ['https://example.com/contact/']);
  const plan = planDiscoveryCrawl(inventory, start, 2);

  assert.equal(classifyUrlCandidate('https://example.com/kitchen-remodeling/', start).category, 'core');
  assert.equal(classifyUrlCandidate('https://example.com/kitchen-remodeling/cost-guide/', start).category, 'editorial');
  assert.equal(classifyUrlCandidate('https://example.com/service-areas/venice-ca/', start).category, 'location');
  assert.equal(classifyUrlCandidate('https://example.com/projects/oak-drive/', start).category, 'proof');
  assert.equal(classifyUrlCandidate('https://example.com/privacy-policy/', start).category, 'utility');
  assert.equal(inventory.categories.core, 4);
  assert.equal(plan.selected.filter((entry) => entry.category === 'core').length, 3);
  assert.equal(plan.selected.filter((entry) => entry.category === 'editorial').length, 2);
  assert.equal(plan.selected.filter((entry) => entry.category === 'location').length, 2);
  assert.equal(plan.selected.filter((entry) => entry.category === 'proof').length, 1);
  assert.equal(plan.selected.some((entry) => entry.category === 'utility'), false);
});

test('build plans contain explicit routes and collection source pages', () => {
  const home = extractPage('<html><head><title>Builder</title></head><body><h1>Builder</h1></body></html>', 'https://example.com/');
  const service = extractPage('<html><head><title>Kitchen Remodeling</title></head><body><h1>Kitchen Remodeling</h1></body></html>', 'https://example.com/kitchen-remodeling/');
  const guide = extractPage('<html><head><title>Kitchen Guide</title></head><body><h1>Kitchen Guide</h1></body></html>', 'https://example.com/kitchen-remodeling/guide/');
  const inventory = buildUrlInventory([home.url, service.url, guide.url], new URL(home.url));
  const discovery = discoveryFrom('routes1', home.url, [home, service, guide], { inventory, crawlPlan: planDiscoveryCrawl(inventory, new URL(home.url), 2) });
  const plan = initialBuildPlan(discovery);

  assert.deepEqual(plan.routeManifest.routes.map((route) => route.path), ['/', '/kitchen-remodeling']);
  assert.equal(plan.routeManifest.collections.resources.strategy, 'curated-representatives');
  assert.deepEqual(plan.routeManifest.collections.resources.sourcePages, ['https://example.com/kitchen-remodeling/guide/']);
});

test('does not turn long-tail service articles into project proof', () => {
  const article = extractPage('<html><head><title>Kitchen Remodeling Guide</title></head><body><h1>Kitchen Remodeling Guide</h1><h2>Planning your project</h2></body></html>', 'https://example.com/kitchen-remodeling/planning-guide/');
  assert.equal(article.pageType, 'project');
  const inventory = buildUrlInventory([article.url], new URL('https://example.com/'));
  const discovery = discoveryFrom('proof1', 'https://example.com/', [article], { inventory, crawlPlan: planDiscoveryCrawl(inventory, new URL('https://example.com/'), 2) });

  assert.equal(inventory.categories.editorial, 1);
  assert.equal(discovery.counts.projects, 0);
  assert.equal(discovery.recommendation.includeProjects, false);
});

test('detects visitor-facing generation and source-site language without rejecting preview paths', () => {
  assert.ok(visitorMetaLanguage('These testimonials appeared on the original website.'));
  assert.ok(visitorMetaLanguage('Explore our website redesign concept.'));
  assert.ok(visitorMetaLanguage('Each collection stays tied to its original source page.'));
  assert.ok(visitorMetaLanguage("A project example from the business's source gallery."));
  assert.ok(visitorMetaLanguage('Adapted from the original resource library.'));
  assert.ok(visitorMetaLanguage('Preserved where it originally appeared.'));
  assert.equal(visitorMetaLanguage('Hear from clients about their remodeling experiences.'), null);
  assert.equal(visitorMetaLanguage('/preview/abc123/assets/index.js'), null);
});

test('generation is explicitly uninterrupted and non-interactive', () => {
  const prompt = generationPrompt('abc123');

  assert.match(prompt, /^Build a complete standalone static marketing website for prospect abc123\./);
  assert.match(prompt, /\/preview\/abc123\//);
  assert.doesNotMatch(prompt, /\{\{prospectId\}\}/);
  assert.ok(prompt.split('\n').length > 10);
  assert.match(prompt, /strictly non-interactive/i);
  assert.match(prompt, /Do not ask the operator or user any questions/i);
  assert.match(prompt, /choose the strongest direction yourself/i);
  assert.match(prompt, /Do not finish until the website is implemented/i);
  assert.match(prompt, /routeManifest/);
});

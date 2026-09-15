import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';

type Prospect = { id: string; businessName: string; sourceUrl: string; status: string; updatedAt: string; previewUrl?: string };

const capabilities = [
  { number: '01', title: 'Apps & Platforms', description: 'Custom applications and digital platforms shaped around the way your business actually works.', image: '/capability-apps.webp' },
  { number: '02', title: 'AI & Automation', description: 'Intelligent systems and automation that turn operational complexity into useful leverage.', image: '/capability-ai.webp' },
  { number: '03', title: 'Websites & Digital Experiences', description: 'Fast, considered digital experiences that communicate clearly and work beautifully.', image: '/capability-web.webp' },
];

function Arrow() { return <span aria-hidden="true">↗</span>; }

function PublicSite() {
  const heroRef = useRef<HTMLElement>(null);
  function moveHero(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    heroRef.current?.style.setProperty('--pointer-x', `${x * -1.5}%`);
    heroRef.current?.style.setProperty('--pointer-y', `${y * -1.5}%`);
  }
  return <main className="public-site">
    <section className="hero" ref={heroRef} onPointerMove={moveHero}>
      <div className="hero-media" aria-hidden="true" />
      <header className="public-nav">
        <a className="brand" href="#top" aria-label="Aderet Technologies home">Aderet Technologies</a>
        <nav aria-label="Primary navigation"><a href="#capabilities">Capabilities</a><a href="#about">About</a><a href="mailto:daniel@aderet.tech">Contact</a></nav>
        <a className="nav-status" href="mailto:daniel@aderet.tech"><i /> Build what&rsquo;s next</a>
      </header>
      <div className="hero-content" id="top">
        <p className="signal">Ideas <span>→</span> systems <span>→</span> real impact</p>
        <h1>Build<br />what&rsquo;s next.</h1>
        <p className="hero-lede">We design and engineer apps, intelligent systems, digital platforms, and web experiences for businesses moving forward.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="mailto:daniel@aderet.tech?subject=Let%27s%20build%20what%27s%20next">Start a project <Arrow /></a>
          <a className="button button-secondary" href="#capabilities">Explore capabilities</a>
        </div>
      </div>
      <p className="hero-note">People<br />ideas<br />technology<br />a brighter tomorrow</p>
      <p className="hero-footnote">Technology<br />for a brighter<br />tomorrow</p>
    </section>

    <section className="capabilities" id="capabilities">
      <div className="section-meta"><span>01</span><i /><p>Technology, end to end.</p></div>
      <div className="section-intro">
        <h2>Technology,<br />end to end.</h2>
        <p>From complex internal systems to customer-facing platforms, we help ambitious teams turn difficult ideas and operational problems into excellent software.</p>
      </div>
      <div className="capability-grid">{capabilities.map((capability) => <article className="capability" key={capability.title}>
        <div className="capability-image"><img src={capability.image} alt="" /><span>{capability.number}</span></div>
        <h3>{capability.title}</h3><p>{capability.description}</p>
      </article>)}</div>
    </section>

    <section className="founder" id="about">
      <div className="section-meta founder-meta"><span>02</span><i /><p>Engineering a brighter tomorrow.</p></div>
      <div className="founder-layout">
        <figure className="founder-photo"><img src="/headshot.jpg" alt="Daniel Benaderet" /></figure>
        <div className="founder-copy">
          <p className="kicker">Aderet is led by</p><h2>Daniel Benaderet</h2>
          <p>Daniel is a senior full-stack engineer with deep experience building production software across consumer, media, aerospace, and internal-platform environments.</p>
          <p>Past work includes engineering roles and projects connected to Disney, NBCUniversal, and SpaceX. Today, he works directly with businesses that need ambitious technology delivered with clarity and care.</p>
          <div className="founder-links"><a href="mailto:daniel@aderet.tech">daniel@aderet.tech <Arrow /></a><a href="https://www.linkedin.com/in/dbenaderet" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href="https://github.com/dbenader" target="_blank" rel="noreferrer">GitHub <Arrow /></a></div>
        </div>
        <blockquote>Complex problems.<br />Clear systems.<br />A brighter tomorrow.</blockquote>
      </div>
    </section>

    <section className="closing"><p>Have an ambitious idea or a stubborn operational problem?</p><a href="mailto:daniel@aderet.tech?subject=A%20project%20for%20Aderet">Let&rsquo;s build what&rsquo;s next. <Arrow /></a></section>
    <footer className="public-footer"><strong>Aderet Technologies</strong><span>Ideas to a brighter tomorrow.</span><span>Los Angeles, CA</span></footer>
  </main>;
}

const labSteps = ['Crawl source', 'Extract facts', 'Direct agent', 'Build & inspect', 'Publish preview'];

function LabDashboard() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  useEffect(() => { fetch('/prospects.json').then((response) => response.ok ? response.json() : []).then(setProspects).catch(() => setProspects([])); }, []);
  const command = useMemo(() => `npm run prospect -- ${url || 'https://example.com'}`, [url]);
  async function copyCommand(event: FormEvent) { event.preventDefault(); await navigator.clipboard.writeText(command); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <main className="lab-site">
    <header className="lab-topbar"><a className="lab-wordmark" href="/" aria-label="Aderet home"><span>A</span><strong>ADERET <em>/ LABS</em></strong></a><div className="environment"><span /> local pipeline</div></header>
    <section className="lab-hero"><div className="lab-hero-copy">
      <p className="lab-eyebrow">PROSPECT ENGINE · 001</p><h1>Old website in.<br /><span>Better business out.</span></h1>
      <p className="lab-intro">A focused production line for turning a business&rsquo;s existing facts and assets into a considered, modern website—without inventing a thing.</p>
      <form className="command" onSubmit={copyCommand}><label htmlFor="source-url">SOURCE WEBSITE</label><div className="command-row"><span className="prompt">›</span><input id="source-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example-plumber.com" required /><button type="submit">{copied ? 'Copied' : 'Copy command'} <Arrow /></button></div></form>
      <p className="lab-hint">Run from the repository. The coding agent works inside an isolated prospect directory.</p>
    </div><aside className="status-panel" aria-label="Pipeline status"><div className="panel-head"><span>PIPELINE</span><span>READY</span></div><ol>{labSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong><i /></li>)}</ol><div className="guardrail"><span>FACTUALITY LOCK</span><strong>Source-bound</strong><p>No fabricated reviews, services, credentials, or claims.</p></div></aside></section>
    <section className="workbench"><div className="lab-section-title"><p className="lab-eyebrow">OUTPUT REGISTER</p><h2>Prospects</h2><span>{prospects.length.toString().padStart(2, '0')} total</span></div>
      {prospects.length ? <div className="prospect-list">{prospects.map((prospect) => <article key={prospect.id}><span className="prospect-id">{prospect.id}</span><div><h3>{prospect.businessName}</h3><a href={prospect.sourceUrl} target="_blank" rel="noreferrer">{new URL(prospect.sourceUrl).hostname}</a></div><span className={`status status-${prospect.status}`}>{prospect.status}</span>{prospect.previewUrl ? <a className="preview-link" href={prospect.previewUrl}>Open preview <Arrow /></a> : <span className="muted">Not deployed</span>}</article>)}</div> : <div className="empty-state"><span>Ø</span><div><h3>No prospects on the line.</h3><p>Copy the command above to create the first one. Rebuild this dashboard to refresh the register.</p></div></div>}
    </section><footer className="lab-footer"><span>Aderet Technologies</span><span>Website systems, deliberately made.</span><span>v0.1 MVP</span></footer>
  </main>;
}

function App() { return window.location.pathname.startsWith('/lab') ? <LabDashboard /> : <PublicSite />; }
export default App;

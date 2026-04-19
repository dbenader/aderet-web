'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './styles.module.scss';

const services = [
  {
    icon: 'workflow',
    eyebrow: 'Process to product',
    title: 'Automation design',
  },
  {
    icon: 'tool',
    eyebrow: 'Internal tools',
    title: 'Custom software',
  },
  {
    icon: 'spark',
    eyebrow: 'AI where useful',
    title: 'Practical AI',
  },
  {
    icon: 'compass',
    eyebrow: 'Architecture',
    title: 'Technical advisory',
  },
] as const;

const serviceIcons = {
  workflow: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="6" width="16" height="11" rx="2.5" />
      <rect x="28" y="20" width="16" height="11" rx="2.5" />
      <rect x="4" y="31" width="16" height="11" rx="2.5" />
      <path d="M20 11.5h4c3 0 5 2 5 5v3.5" />
      <path d="M28 31.5h-4c-3 0-5-2-5-5v-3" />
    </svg>
  ),
  tool: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="9" width="40" height="30" rx="3.5" />
      <line x1="4" y1="18" x2="44" y2="18" />
      <circle cx="11" cy="13.5" r="1.8" />
      <circle cx="17.5" cy="13.5" r="1.8" />
      <circle cx="24" cy="13.5" r="1.8" />
      <rect x="9" y="23" width="11" height="10" rx="2" />
      <line x1="24" y1="24.5" x2="39" y2="24.5" />
      <line x1="24" y1="29" x2="35" y2="29" />
      <line x1="24" y1="33" x2="38" y2="33" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="5" />
      <circle cx="9" cy="13" r="3" />
      <circle cx="39" cy="13" r="3" />
      <circle cx="7" cy="35" r="3" />
      <circle cx="41" cy="35" r="3" />
      <circle cx="24" cy="7" r="3" />
      <line x1="12" y1="15" x2="20" y2="21" />
      <line x1="36" y1="15" x2="28" y2="21" />
      <line x1="10" y1="33" x2="20" y2="27" />
      <line x1="38" y1="33" x2="28" y2="27" />
      <line x1="24" y1="10" x2="24" y2="19" />
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="20" cy="20" r="14" />
      <line x1="30.5" y1="30.5" x2="43" y2="43" />
      <rect x="14" y="12" width="12" height="7" rx="1.5" />
      <line x1="20" y1="19" x2="20" y2="24" />
      <line x1="13" y1="24" x2="27" y2="24" />
      <rect x="10" y="24" width="8" height="5" rx="1" />
      <rect x="22" y="24" width="8" height="5" rx="1" />
    </svg>
  ),
};

const capabilities = [
  {
    label: 'Email & calendar',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="4" width="16" height="12" rx="2" />
        <path d="M2 7l8 5 8-5" />
      </svg>
    ),
  },
  {
    label: 'Slack & chat',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M7 3a2 2 0 0 0 0 4h2V5a2 2 0 0 0-2-2z" />
        <path d="M13 3a2 2 0 0 1 0 4h-2V5a2 2 0 0 1 2-2z" />
        <path d="M3 9a2 2 0 0 1 4 0v2H5a2 2 0 0 1-2-2z" />
        <path d="M17 9a2 2 0 0 0-4 0v2h2a2 2 0 0 0 2-2z" />
        <path d="M7 17a2 2 0 0 1 0-4h2v2a2 2 0 0 1-2 2z" />
        <path d="M13 17a2 2 0 0 0 0-4h-2v2a2 2 0 0 0 2 2z" />
        <path d="M3 13a2 2 0 0 0 4 0v-2H5a2 2 0 0 0-2 2z" />
        <path d="M17 13a2 2 0 0 1-4 0v-2h2a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'CRM',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="6" r="3" />
        <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </svg>
    ),
  },
  {
    label: 'Spreadsheets',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="2" width="16" height="16" rx="2" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="2" y1="8" x2="18" y2="8" />
        <line x1="2" y1="13" x2="18" y2="13" />
      </svg>
    ),
  },
  {
    label: 'Dashboards',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="10" width="4" height="8" rx="1" />
        <rect x="8" y="6" width="4" height="12" rx="1" />
        <rect x="14" y="2" width="4" height="16" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Mobile apps',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="5" y="1" width="10" height="18" rx="2.5" />
        <line x1="8.5" y1="16" x2="11.5" y2="16" />
      </svg>
    ),
  },
  {
    label: 'APIs & webhooks',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M7 5 3 10l4 5" />
        <path d="M13 5l4 5-4 5" />
        <line x1="11" y1="3" x2="9" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Document AI',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M11 2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M11 2v6h6" />
        <path d="M14 13l1.5-3.5L17 13" />
        <line x1="14.4" y1="12" x2="16.6" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Databases',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <ellipse cx="10" cy="5" rx="7" ry="3" />
        <path d="M3 5v4c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M3 9v4c0 1.7 3.1 3 7 3s7-1.3 7-3V9" />
      </svg>
    ),
  },
  {
    label: 'Forms & intake',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <line x1="6" y1="7" x2="14" y2="7" />
        <line x1="6" y1="11" x2="14" y2="11" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    ),
  },
  {
    label: 'AI chatbots',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3 3h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-4 3V5a2 2 0 0 1 2-2z" />
        <path d="M8.5 10l1-2.5 1 2.5" />
        <line x1="8.9" y1="9.2" x2="10.1" y2="9.2" />
        <circle cx="13.5" cy="9" r="1" />
      </svg>
    ),
  },
  {
    label: 'Voice agents',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="7" y="2" width="6" height="9" rx="3" />
        <path d="M4 10a6 6 0 0 0 12 0" />
        <line x1="10" y1="16" x2="10" y2="19" />
        <line x1="7" y1="19" x2="13" y2="19" />
      </svg>
    ),
  },
  {
    label: 'Payments',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="5" width="16" height="12" rx="2" />
        <line x1="2" y1="9" x2="18" y2="9" />
        <line x1="5" y1="13.5" x2="8" y2="13.5" />
        <line x1="10" y1="13.5" x2="11.5" y2="13.5" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 2a6 6 0 0 1 6 6v3l2 2H2l2-2V8a6 6 0 0 1 6-6z" />
        <path d="M8 17a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    label: 'Reports & PDFs',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M12 2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M12 2v5h5" />
        <line x1="6" y1="11" x2="14" y2="11" />
        <line x1="6" y1="14" x2="11" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Scheduling',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="4" width="16" height="14" rx="2" />
        <line x1="2" y1="9" x2="18" y2="9" />
        <line x1="6" y1="2" x2="6" y2="6" />
        <line x1="14" y1="2" x2="14" y2="6" />
        <rect x="5" y="12" width="3" height="3" rx="0.5" />
        <rect x="12" y="12" width="3" height="3" rx="0.5" />
      </svg>
    ),
  },
  {
    label: 'E-commerce',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M2 3h2l2.4 8.5h8.2l2-6H6.5" />
        <circle cx="9" cy="17" r="1.5" />
        <circle cx="15" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <polyline points="2,15 6,9 10,12 14,5 18,8" />
        <line x1="2" y1="18" x2="18" y2="18" />
      </svg>
    ),
  },
  {
    label: 'Cloud storage',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M14.5 10a4.5 4.5 0 0 0-9 0H4.5a3 3 0 0 0 0 6h11a3 3 0 0 0 0-6h-.5z" />
      </svg>
    ),
  },
  {
    label: 'Customer portals',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="10" width="14" height="8" rx="2" />
        <path d="M7 10V7a3 3 0 0 1 6 0v3" />
        <circle cx="10" cy="14.5" r="1.5" />
      </svg>
    ),
  },
  {
    label: 'Kanban & tracking',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="2" y="3" width="4" height="14" rx="1" />
        <rect x="8" y="3" width="4" height="9" rx="1" />
        <rect x="14" y="3" width="4" height="11" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Maps & location',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 2a6 6 0 0 1 6 6c0 5-6 10-6 10S4 13 4 8a6 6 0 0 1 6-6z" />
        <circle cx="10" cy="8" r="2" />
      </svg>
    ),
  },
  {
    label: 'Social media',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="5.5" cy="10" r="2.5" />
        <circle cx="15" cy="4.5" r="2.5" />
        <circle cx="15" cy="15.5" r="2.5" />
        <line x1="7.8" y1="8.9" x2="12.7" y2="5.6" />
        <line x1="7.8" y1="11.1" x2="12.7" y2="14.4" />
      </svg>
    ),
  },
  {
    label: 'Transcription',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <polyline points="1,12 3,7 5,14 7,5 9,13 11,8 13,12 15,10 17,11 19,9" />
      </svg>
    ),
  },
  {
    label: 'Search & RAG',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="9" cy="9" r="6" />
        <line x1="13.5" y1="13.5" x2="18" y2="18" />
        <line x1="6.5" y1="9" x2="11.5" y2="9" />
        <line x1="9" y1="6.5" x2="9" y2="11.5" />
      </svg>
    ),
  },
  {
    label: 'Web scraping',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <ellipse cx="10" cy="10" rx="3.5" ry="8" />
        <line x1="2" y1="10" x2="18" y2="10" />
        <line x1="3" y1="6" x2="17" y2="6" />
        <line x1="3" y1="14" x2="17" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Invoicing',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <line x1="6" y1="7" x2="14" y2="7" />
        <line x1="6" y1="10" x2="14" y2="10" />
        <path d="M10 13v3" />
        <path d="M8.5 14.2h3a1 1 0 0 1 0 2h-3" />
      </svg>
    ),
  },
  {
    label: 'Monitoring',
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 15a7 7 0 0 1 12 0" />
        <line x1="10" y1="8" x2="10" y2="11" />
        <line x1="13.6" y1="9.4" x2="12.2" y2="10.8" />
        <circle cx="10" cy="15" r="1.5" />
      </svg>
    ),
  },
];

const flows = [
  'New lead arrives from a form. The workflow enriches the company, creates a CRM record, assigns an owner, drafts a response, and books the next step.',
  'A customer request lands after hours. The system categorizes it, checks policy docs, prepares context, and alerts the right person only when judgment is needed.',
  'Weekly sales data changes. A workflow pulls numbers from Stripe and Sheets, flags movement, prepares a plain-English brief, and posts it to Slack.',
];

const pricing = [
  {
    name: 'Diagnostic',
    price: '$750',
    detail: 'One working session plus a written systems map, tool recommendations, and first build plan.',
  },
  {
    name: 'Build Sprint',
    price: '$4k-$12k',
    detail: 'A focused implementation: one production workflow, integration, AI feature, or internal tool delivered end to end.',
  },
  {
    name: 'Technology Retainer',
    price: '$3k+/mo',
    detail: 'Ongoing automation, software delivery, AI experiments, maintenance, and engineering support for steady momentum.',
  },
];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMedia} aria-hidden="true" />
        <div className={styles.heroShade} />
        <header className={styles.nav}>
          <Link href="/" className={styles.brand} aria-label="Aderet Technologies home">
            <Image src="/logo4.png" width={44} height={44} alt="" priority />
            <span>Aderet Technologies</span>
          </Link>
          <nav aria-label="Primary navigation">
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <a href="mailto:daniel@aderet.tech">Contact</a>
          </nav>
        </header>

        <div className={styles.heroContent}>
          <p className={styles.kicker}>Technology concierge</p>
          <h1 id="hero-title">I build the technology your competitors don&rsquo;t have yet.</h1>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="mailto:daniel@aderet.tech">
              Start a project
            </a>
            <a className={styles.secondaryAction} href="#services">
              See what I build
            </a>
          </div>
        </div>
      </section>

      <section id="services" className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Services</p>
          <h2>What I build</h2>
        </div>
        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <article className={styles.service} key={service.title}>
              <div className={styles.serviceIcon}>{serviceIcons[service.icon]}</div>
              <p>{service.eyebrow}</p>
              <h3>{service.title}</h3>
            </article>
          ))}
        </div>
        <div className={styles.capabilityStrip}>
          {capabilities.map((cap) => (
            <div className={styles.capabilityBadge} key={cap.label}>
              {cap.icon}
              <span>{cap.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.parallaxBand} aria-label="Automation examples">
        <div className={styles.bandInner}>
          <p className={styles.kicker}>Example flows</p>
          <h2>Small systems become real leverage when they cross the handoff.</h2>
          <div className={styles.flowList}>
            {flows.map((flow) => (
              <p key={flow}>{flow}</p>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.kicker}>Pricing</p>
          <h2>Simple entry points, scoped around business outcomes.</h2>
        </div>
        <div className={styles.pricingGrid}>
          {pricing.map((tier) => (
            <article className={styles.priceCard} key={tier.name}>
              <h3>{tier.name}</h3>
              <strong>{tier.price}</strong>
              <p>{tier.detail}</p>
            </article>
          ))}
        </div>
        <p className={styles.pricingNote}>
          Final pricing depends on system access, complexity, approval requirements, and how much custom software is needed.
        </p>
      </section>

      <section id="about" className={styles.about}>
        <div className={styles.aboutText}>
          <p className={styles.kicker}>About</p>
          <h2>Technology built by a human who understands human problems.</h2>
          <p>
            Aderet Technologies LLC is led by Daniel Benaderet, a senior full-stack engineer with deep experience building production software across consumer, media, aerospace, and internal platform environments.
          </p>
          <p>
            Past work includes engineering roles and projects connected to Disney, NBCUniversal, and SpaceX. The focus now is direct, hands-on technology delivery for businesses that need useful capability without building a full engineering team.
          </p>
          <div className={styles.profileLinks}>
            <a href="https://www.linkedin.com/in/dbenaderet" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href="https://github.com/dbenader" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <Image
          src="/headshot.png"
          width={420}
          height={420}
          alt="Daniel Benaderet"
          className={styles.headshot}
        />
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>Aderet Technologies LLC</strong>
          <p>Automation, custom software, and practical AI.</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/nibbly/privacy-policy">Privacy</Link>
          <Link href="/nibbly/terms-of-service">Terms</Link>
          <a href="mailto:daniel@aderet.tech">daniel@aderet.tech</a>
        </div>
      </footer>
    </main>
  );
}

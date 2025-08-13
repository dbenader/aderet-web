/* app/nibbly/page.tsx */
'use client';
import Link from 'next/link';
import './styles/nibbly.scss';

export default function NibblyLanding() {
  return (
    <section className="hero">
      <div className="content">
        <h1>Nibbly&nbsp;AI</h1>

        <div className="app-stores">
          <a href="https://apps.apple.com/us/app/nibbly-ai/id6746419493">
            <img src="/nibbly/app-store-button.svg" alt="Download on the App Store" width={150} />
          </a>
          {/* <img src="/nibbly/play-store-button.png" alt="Get it on Google Play"   width={150} /> */}
        </div>

        <div className="links">
          <Link className="link" href="/nibbly/privacy-policy">Privacy Policy</Link>
          <Link className="link" href="/nibbly/terms-of-service">Terms of Service</Link>
          <Link className="link" href="/nibbly/support">Support</Link>
        </div>
      </div>
    </section>
  );
}

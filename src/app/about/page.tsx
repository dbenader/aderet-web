import styles from './styles.module.scss';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <section className={styles.about}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={styles.bgVideo}
        disablePictureInPicture
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className={styles.overlay}>
        <div className={styles.content}>
          {/* Hero */}
          <div className={styles.hero}>
            <Image
              src="/headshot.png"
              alt="Daniel Benaderet headshot"
              width={120}
              height={120}
              className={styles.headshot}
            />
            <h1>Hi, I’m Daniel Benaderet</h1>
            <p>
              Founder of <strong>Aderet Technologies LLC</strong>. I’m a
              full-stack engineer passionate about building simple,
              AI-driven apps that make life easier.
            </p>
          </div>

          {/* About Aderet */}
          <div className={styles.section}>
            <h2>About Aderet Technologies</h2>
            <p>
              Aderet Technologies LLC is my personal software studio where I
              design, build, and launch modern apps. Current projects include{' '}
              <Link href="/nibbly">Nibbly AI</Link> and{' '}
              <Link href="/hammock">Hamock</Link>.
            </p>
          </div>

          {/* Professional Background */}
          <div className={styles.section}>
            <h2>Professional Background</h2>
            <ul>
              <li>Principal / Full-Stack Engineer with 10+ years of experience</li>
              <li>Former Principal Engineer at NBCUniversal</li>
              <li>Expertise in Java, Spring Boot, React, React Native, AWS</li>
              <li>Passionate about AI-powered consumer apps</li>
            </ul>
          </div>

          {/* Resume & Socials */}
          <div className={styles.section}>
            <h2>Links</h2>
            <div className={styles.socials}>
              <a
                href="www.linkedin.com/in/dbenaderet"
                target="_blank"
                rel="noopener noreferrer"
                style={{background: '#FFF', height: '40px', width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '20px'}}
              >
                
                <img
                src="/linkedIn.png"
                alt='linkedIn logo'
                style={{width: 30}}/>
              </a>
              <a
                href="https://github.com/dbenader"
                target="_blank"
                rel="noopener noreferrer"
                style={{background: '#FFF', height: '40px', width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '20px'}}
              >
                <img
                src="/github.png"
                alt='linkedIn logo'
                style={{width: 30}}/>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className={styles.section}>
            <h2>Contact</h2>
            <p>
              Reach me at{' '}
              <a href="mailto:daniel@aderet.tech">daniel.benaderet@aderet.tech</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

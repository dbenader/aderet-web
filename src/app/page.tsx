'use client';
import styles from './styles.module.scss';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className={styles.main}>
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

      <div className={styles.overlayContent}>
        <Image className={styles.logo} src="/logo4.png" width={120} height={120} alt="Aderet Technologies LLC logo" />
        <h1>Aderet Technologies</h1>
        <nav>
          <Link href="/nibbly">Nibbly AI</Link>
          <Link href="/hammock">Hammock</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </main>
  );
}

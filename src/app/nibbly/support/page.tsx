import Link from 'next/link';
import styles from './styles.module.scss';

export default function Support() {
  return (
    <main className={styles.root}>
      <article className={styles.content}>
        <h1>Support</h1>

        <p>
          Need help? Email us at&nbsp;
          <a href="mailto:support@aderet.tech">support@aderet.tech</a>.
        </p>

        <h2>Helpful Links</h2>
        <ul>
          <li>
            <Link href="/privacy-policy">Privacy&nbsp;Policy</Link>
          </li>
          <li>
            <Link href="/terms-of-service">Terms&nbsp;of&nbsp;Service</Link>
          </li>
        </ul>

        <h2>Delete Your Account</h2>
        <p>
          If you wish to remove your personal data from Nibbly:
        </p>
        <ol>
          <li>Open the&nbsp;<strong>Profile</strong>&nbsp;tab in the app.</li>
          <li>Scroll to the bottom.</li>
          <li>Tap the&nbsp;<strong>Delete&nbsp;Account</strong>&nbsp;button and confirm.</li>
        </ol>
        <p>
          Deleting your account permanently erases personally identifiable information
          (name, email, health data). We may keep non-identifiable usage data
          to help us improve Nibbly’s features and performance.
        </p>
      </article>
    </main>
  );
}

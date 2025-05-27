import styles from './styles.module.scss';

export default function TermsOfService() {
  return (
    <main className={styles.root}>
      <article className={styles.content}>
        <h1>Terms&nbsp;of&nbsp;Service</h1>
        <p><strong>Effective date:</strong> 27 May 2025</p>

        <h2>1. Acceptance of These Terms</h2>
        <p>
          By installing, accessing, or using Nibbly (“<strong>the App</strong>”)
          you agree to be bound by these Terms of Service (“<strong>Terms</strong>”)
          and our&nbsp;
          <a href="/privacy-policy">Privacy&nbsp;Policy</a>.
          If you do not agree, do not use the App.
        </p>

        <h2>2. Who We Are</h2>
        <p>
          Nibbly is developed and operated by <strong>Aderet Technologies LLC</strong>,
          a Michigan-registered company (“we,” “us,” “our”).
        </p>

        <h2>3. Eligibility & Account</h2>
        <ul>
          <li>You must be at least 13 years old to use Nibbly.</li>
          <li>
            You are responsible for maintaining the confidentiality of your
            login credentials and for all activity that occurs under your account.
          </li>
        </ul>

        <h2>4. License to Use the App</h2>
        <p>
          We grant you a personal, non-exclusive, revocable, and
          non-transferable license to use the App for its intended purpose, subject to these Terms.
          You may not copy, modify, distribute, sell, or lease any part of the App
          except as expressly allowed by law or by us in writing.
        </p>

        <h2>5. Prohibited Conduct</h2>
        <p>When using Nibbly you agree <em>not</em> to:</p>
        <ul>
          <li>Violate any applicable law or regulation.</li>
          <li>Upload unlawful, misleading, or infringing content.</li>
          <li>Reverse-engineer, decompile, or attempt to extract source code.</li>
          <li>Interfere with or disrupt the App, servers, or networks.</li>
          <li>Use the App to develop a competing product or service.</li>
        </ul>

        <h2>6. User Content</h2>
        <p>
          You retain ownership of photos, descriptions, and other content you
          submit (“<strong>User&nbsp;Content</strong>”). By submitting it,
          you grant us a worldwide, royalty-free license to store, process,
          and display that content to operate and improve the App.
        </p>

        <h2>7. In-App Purchases</h2>
        <p>
          If we offer paid features or subscriptions,
          all sales are final unless required otherwise by
          applicable law or the relevant app-store policies.
        </p>

        <h2>8. Disclaimers</h2>
        <ul>
          <li>
            Nibbly provides nutrition estimates for informational purposes only
            and is <strong>not</strong> a substitute for professional medical advice.
          </li>
          <li>
            The App is provided “as is” and “as available.”
            We make no warranties of any kind, express or implied.
          </li>
        </ul>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law,
          Aderet Technologies LLC will not be liable for any indirect, incidental,
          special, consequential, or punitive damages,
          or any loss of data, profits, or reputation arising from your use of Nibbly.
        </p>

        <h2>10. Indemnity</h2>
        <p>
          You agree to indemnify and hold harmless Aderet Technologies LLC
          from any claims, damages, or expenses arising out of
          your misuse of the App or violation of these Terms.
        </p>

        <h2>11. Termination</h2>
        <p>
          We may suspend or terminate your access to Nibbly at any time,
          with or without notice, if you violate these Terms
          or if we discontinue the App.
        </p>

        <h2>12. Changes to the App or Terms</h2>
        <p>
          We may modify the App or these Terms at any time.
          When we do, we will post the updated Terms and revise the “Effective date.”
          Continued use after changes means you accept the updated Terms.
        </p>

        <h2>13. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of Michigan, USA,
          without regard to conflict-of-law rules.
          Any dispute will be resolved exclusively in the federal or state courts
          located in Detroit, Michigan.
        </p>

        <h2>14. Contact</h2>
        <p>
          Questions? Email&nbsp;
          <a href="mailto:support@aderettech.com">support@aderettech.com</a> or write to:<br/>
          Aderet Technologies LLC<br/>
          100 Main St, Suite 200<br/>
          Detroit, MI 48201 USA
        </p>
      </article>
    </main>
  );
}

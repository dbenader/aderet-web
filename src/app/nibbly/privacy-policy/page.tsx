import styles from './styles.module.scss';

export default function PrivacyPolicy() {
  return (
    <main className={styles.root}>
      <article className={styles.content}>
        <h1>Privacy Policy</h1>
        <p><strong>Effective date:</strong> 27 May 2025</p>

        <p>
          Nibbly (“<strong>the App</strong>”) is owned and operated by 
          <strong> Aderet Technologies LLC</strong> (“we,” “us,” “our”). 
          Your privacy is important to us. This policy explains what information we collect, 
          why we collect it, how we use it, and the choices you have.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Account details & sign-in data.</strong> Name, email address, and authentication tokens provided by Apple or Google.</li>
          <li><strong>Profile & health data.</strong> Height, weight, age, activity level, dietary goals, and nutrition targets you set in the App.</li>
          <li><strong>Food entries & images.</strong> Photos you upload, text descriptions, AI-generated food classifications, and nutrition summaries.</li>
          <li><strong>Device & usage data.</strong> IP address, device model, operating system, crash logs, and in-app actions (collected via analytics tools).</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To operate and improve core features such as calorie counting, nutrition goal tracking, and AI food recognition.</li>
          <li>To personalize your experience—for example, showing progress toward your daily goals.</li>
          <li>To communicate with you about updates, support requests, or important security notices.</li>
          <li>To monitor, debug, and enhance the App’s performance and security.</li>
        </ul>

        <h2>3. When We Share Information</h2>
        <p>We do <em>not</em> sell your data. We share it only:</p>
        <ul>
          <li>With <strong>service providers</strong> who help us run Nibbly (e.g., cloud hosting on AWS, AI processing via OpenAI, analytics platforms). They are bound by confidentiality agreements and may use data only for our instructions.</li>
          <li>When required by law, court order, or to protect the rights, property, or safety of Aderet Technologies LLC, our users, or the public.</li>
          <li>As part of a business transfer (e.g., merger or acquisition). You will receive notice before your data is transferred and becomes subject to a new policy.</li>
        </ul>

        <h2>4. Security</h2>
        <p>
          We encrypt data in transit (HTTPS) and at rest where supported (AWS S3, Postgres). 
          Internal access is limited to employees who need it to perform their job. 
          No internet transmission or storage system is 100 % secure, so we cannot guarantee absolute security.
        </p>

        <h2>5. Your Choices & Rights</h2>
        <ul>
          <li><strong>Access or update.</strong> You can view and edit most profile data in App settings.</li>
          <li><strong>Delete account.</strong> You may delete your account at any time. Personal identifiers are erased, but we may retain anonymized, aggregate data (e.g., overall nutrition statistics) for business analytics and to meet legal obligations.</li>
          <li><strong>Email preferences.</strong> You may opt out of non-essential emails by following the unsubscribe link in the message.</li>
        </ul>

        <h2>6. Children’s Privacy</h2>
        <p>
          Nibbly is not directed to children under 13 and we do not knowingly collect personal
          information from them. If you believe a child has provided us data, please contact us and we will
          delete it.
        </p>

        <h2>7. International Users</h2>
        <p>
          We are a U.S. company. By using the App, you consent to your data being transferred to and
          processed in the United States and any other country where our service providers operate.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the revised version and
          update the “Effective date” above. Material changes will be announced in-app or by email.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          Questions or concerns? Email&nbsp;
          <a href="mailto:privacy@aderettech.com">privacy@aderettech.com</a> or write to:<br />
          Aderet Technologies LLC<br />
          100 Main St, Suite 200<br />
          Detroit, MI 48201&nbsp;USA
        </p>
      </article>
    </main>
  );
}

export default function Home() {
  return (
    <main style={styles.main}>
      <h1 style={styles.heading}>Aderet Technologies LLC</h1>
      <p style={styles.tagline}>Independent software studio building thoughtful mobile apps.</p>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>📱 Apps</h2>
        <ul style={styles.list}>
          <li>
            <strong>Hamock</strong> – A modern property management platform for landlords and tenants.
          </li>
          <li>
            <strong>Nibbly</strong> – A smarter food tracking app with nutrition insights powered by AI.
          </li>
        </ul>
      </section>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Aderet Technologies LLC</p>
      </footer>
    </main>
  );
}

const styles = {
  main: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '80px 20px',
    fontFamily: 'var(--font-geist-sans)',
    textAlign: 'center' as const,
  },
  heading: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  tagline: {
    fontSize: '1.1rem',
    marginBottom: '2rem',
    color: '#666',
  },
  section: {
    marginBottom: '3rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    lineHeight: 1.6,
  },
  footer: {
    borderTop: '1px solid #ddd',
    marginTop: '3rem',
    paddingTop: '1rem',
    fontSize: '0.875rem',
    color: '#999',
  },
};

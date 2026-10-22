
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useSession } from '../components/AuthGuard';
import { supabase, configured } from '../lib/supabase';

export default function Login() {
  const { session, loading } = useSession();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && session) {
    const next = sessionStorage.getItem('wl_next') || '/';
    sessionStorage.removeItem('wl_next');
    return <Navigate to={next} replace />;
  }

  const go = async () => {
    setErr('');

    if (!configured) {
      setErr(
        'Sign-in is temporarily unavailable. Please try again later.'
      );
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setErr(error.message);
      setBusy(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.glow} />

      <section style={styles.card}>
        <div style={styles.logo}>
          <BrandLogo height={62} />
        </div>

        <div style={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</div>

        <h1 style={styles.heading}>
          A world of books,
          <br />
          <span style={styles.accent}>one account away.</span>
        </h1>

        <p style={styles.description}>
          Sign in to discover books, purchase your favourites,
          and enjoy your personal reading experience with Webli Literate.
        </p>

        <button
          type="button"
          onClick={go}
          disabled={busy || loading}
          style={{
            ...styles.button,
            opacity: busy || loading ? 0.7 : 1,
            cursor: busy || loading ? 'wait' : 'pointer',
          }}
        >
          {busy ? (
            <>
              <span style={styles.spinner} />
              Connecting to Google...
            </>
          ) : (
            <>
              <svg
                width="21"
                height="21"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M43.6 24.5c0-1.5-.1-3-.4-4.4H24v8.3h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.3Z"
                />
                <path
                  fill="#34A853"
                  d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.9 1.3-4.1 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.4A20 20 0 0 0 24 44Z"
                />
                <path
                  fill="#FBBC05"
                  d="M12.7 27.7a12 12 0 0 1 0-7.5v-5.4H5.8a20 20 0 0 0 0 18.3l6.9-5.4Z"
                />
                <path
                  fill="#EA4335"
                  d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 14.8l6.9 5.4c1.6-4.8 6.1-8.3 11.3-8.3Z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {err && (
          <div role="alert" style={styles.error}>
            <span aria-hidden="true">!</span>
            {err}
          </div>
        )}

        <div style={styles.separator}>
          <span />
          <small>SECURE SIGN-IN</small>
          <span />
        </div>

        <p style={styles.privacy}>
          By continuing, you agree to use Webli Literate responsibly.
          Your account helps keep your reading experience personal and secure.
        </p>
      </section>

      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} Webli Literate</span>
        <span>Made for readers.</span>
      </footer>

      <style>{`
        * { box-sizing: border-box; }
        button { font: inherit; }
        button:focus-visible {
          outline: 3px solid #9b8cff;
          outline-offset: 4px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes appear {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          .login-card { padding: 30px 22px !important; }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 18px 20px',
    position: 'relative',
    overflow: 'hidden',
    background: '#f7f7fc',
    color: '#17172b',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'rgba(111, 87, 232, 0.09)',
    filter: 'blur(90px)',
    top: '8%',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    padding: '38px 34px 30px',
    border: '1px solid #e8e7f1',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.94)',
    boxShadow: '0 24px 80px rgba(34, 27, 76, 0.09)',
    textAlign: 'center',
    position: 'relative',
    animation: 'appear 0.45s ease-out',
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 27,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '2px',
    color: '#7665cb',
    marginBottom: 15,
  },
  heading: {
    fontSize: 'clamp(28px, 6vw, 36px)',
    lineHeight: 1.2,
    letterSpacing: '-1.3px',
    fontWeight: 800,
    margin: '0 0 16px',
  },
  accent: {
    color: '#7258d8',
  },
  description: {
    color: '#77768b',
    fontSize: 14,
    lineHeight: 1.8,
    margin: '0 auto 28px',
    maxWidth: 345,
  },
  button: {
    width: '100%',
    minHeight: 54,
    border: '1px solid #e5e4eb',
    borderRadius: 12,
    background: '#fff',
    color: '#222235',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    fontSize: 14,
    fontWeight: 700,
    boxShadow: '0 3px 8px rgba(20,20,40,0.04)',
    transition: 'background 0.2s ease',
  },
  spinner: {
    width: 17,
    height: 17,
    border: '2px solid #ddd7fa',
    borderTopColor: '#7258d8',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  error: {
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    background: '#fff0f0',
    color: '#b42318',
    fontSize: 13,
    lineHeight: 1.6,
    display: 'flex',
    gap: 9,
    textAlign: 'left',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '27px 0 17px',
    color: '#9997aa',
  },
  privacy: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#9290a2',
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    width: '100%',
    maxWidth: 460,
    marginTop: 24,
    color: '#9290a2',
    fontSize: 11,
  },
};

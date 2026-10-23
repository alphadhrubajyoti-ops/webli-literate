import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, ShieldCheck, Download } from 'lucide-react';
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
      setErr('Sign-in is temporarily unavailable. Please try again later.');
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

  const perks: [typeof BookOpen, string][] = [
    [BookOpen, 'Browse and buy the books you love'],
    [Download, 'Read or download your PDFs any time'],
    [ShieldCheck, 'Secure payments and a private library'],
  ];

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-brand-700 px-6 py-10 text-white sm:px-12 lg:px-16 lg:py-14">
        <p className="font-display text-xl font-extrabold">Webli Literate</p>
        <div className="py-10 lg:py-0">
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl">
            A world of books, one account away.
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-brand-100">
            Your next chapter starts here.
          </p>
          <ul className="mt-8 hidden space-y-4 lg:block">
            {perks.map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3 text-brand-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-spark-400">
                  <Icon size={18} aria-hidden="true" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden text-sm text-brand-200 lg:block">Made for readers.</p>
      </section>

      <section className="flex items-center justify-center bg-paper px-5 py-10">
        <div className="card w-full max-w-md p-7 text-center sm:p-9">
          <div className="mb-6 flex justify-center">
            <BrandLogo height={84} />
          </div>
          <h2 className="text-2xl font-extrabold">Sign in to continue</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
            Discover books, purchase your favourites, and enjoy your personal reading experience.
          </p>

          <button
            type="button"
            onClick={go}
            disabled={busy || loading}
            className="btn btn-lg mt-7 w-full border-slate-300 bg-white text-ink shadow-sm hover:border-brand-500 hover:bg-brand-50"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                Connecting to Google…
              </>
            ) : (
              <>
                <svg width="21" height="21" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#4285F4" d="M43.6 24.5c0-1.5-.1-3-.4-4.4H24v8.3h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.3Z" />
                  <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.9 1.3-4.1 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.4A20 20 0 0 0 24 44Z" />
                  <path fill="#FBBC05" d="M12.7 27.7a12 12 0 0 1 0-7.5v-5.4H5.8a20 20 0 0 0 0 18.3l6.9-5.4Z" />
                  <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 14.8l6.9 5.4c1.6-4.8 6.1-8.3 11.3-8.3Z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {err && (
            <div role="alert" className="alert alert-error mt-4 text-left">
              <span aria-hidden="true" className="font-bold">!</span>
              <span>{err}</span>
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            By continuing, you agree to use Webli Literate responsibly. Your account keeps your library personal and secure.
          </p>
        </div>
      </section>
    </main>
  );
}


import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, api } from '../lib/supabase';

type BookInfo = {
  title: string | null;
  author: string | null;
};

type Purchase = {
  book_id: string;
  books: BookInfo | BookInfo[] | null;
};

export default function Purchases() {
  const [rows, setRows] = useState<Purchase[] | null>(null);
  const [err, setErr] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPurchases() {
      const { data, error } = await supabase
        .from('entitlements')
        .select('book_id,books(title,author)')
        .eq('revoked', false);

      if (!active) return;

      if (error) {
        console.error('Could not load purchases:', error.message);
        setErr('We could not load your library. Please try again.');
        setRows([]);
        return;
      }

      setRows((data ?? []) as Purchase[]);
    }

    loadPurchases();

    return () => {
      active = false;
    };
  }, []);

  const openBook = useCallback(async (bookId: string) => {
    setErr('');
    setOpeningId(bookId);

    // Open synchronously so the browser is less likely to block the tab.
    const tab = window.open('about:blank', '_blank');

    if (!tab) {
      setErr('Your browser blocked the new tab. Allow pop-ups and try again.');
      setOpeningId(null);
      return;
    }

    tab.opener = null;
    tab.document.title = 'Opening your book…';
    tab.document.body.innerHTML =
      '<p style="font-family:system-ui;padding:24px;color:#245640">Preparing your secure book link…</p>';

    try {
      const result = await api('book-url', { bookId });
      const url = result?.url;

      if (
        typeof url !== 'string' ||
        !['https:', 'http:'].includes(new URL(url).protocol)
      ) {
        throw new Error('Invalid book link');
      }

      tab.location.href = url;
    } catch (error) {
      console.error('Could not open book:', error);
      tab.close();
      setErr('We could not open this book. Please try again or contact support.');
    } finally {
      setOpeningId(null);
    }
  }, []);

  const getBook = (purchase: Purchase): BookInfo => {
    const book = purchase.books;
    return Array.isArray(book) ? book[0] ?? { title: null, author: null } :
      book ?? { title: null, author: null };
  };

  return (
    <main className="wl-library">
      <style>{`
        .wl-library {
          --green: #214f3b;
          --green-dark: #173b2c;
          --cream: #faf8f1;
          --muted: #777b70;
          --line: #e8e5d9;
          min-height: 100vh;
          padding: 36px 20px 64px;
          background: var(--cream);
          color: #242b24;
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }
        .wl-library * { box-sizing: border-box; }
        .wl-container { max-width: 1000px; margin: 0 auto; }
        .wl-topbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding-bottom: 25px; border-bottom: 1px solid var(--line);
        }
        .wl-brand { color: var(--green); font-weight: 850; font-size: 21px; letter-spacing: -.7px; }
        .wl-brand span { color: #b47d43; }
        .wl-back {
          color: var(--green); text-decoration: none; font-size: 13px;
          font-weight: 700; border: 1px solid #d9e1d6; padding: 10px 15px;
          border-radius: 10px; background: white;
        }
        .wl-back:hover { background: #eef3ec; }
        .wl-hero { padding: 42px 0 28px; }
        .wl-eyebrow {
          color: #9b7547; font-size: 11px; font-weight: 800;
          letter-spacing: 2px; text-transform: uppercase;
        }
        .wl-hero h1 {
          margin: 10px 0; color: var(--green-dark);
          font: 700 clamp(32px, 5vw, 46px)/1.1 Georgia, serif;
          letter-spacing: -1px;
        }
        .wl-hero p { margin: 0; max-width: 550px; color: var(--muted); line-height: 1.7; }
        .wl-count {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 20px; padding: 8px 12px; border-radius: 99px;
          background: #edf2e9; color: var(--green); font-size: 12px; font-weight: 750;
        }
        .wl-list { display: grid; gap: 14px; }
        .wl-book {
          display: flex; align-items: center; gap: 20px;
          padding: 20px; border: 1px solid var(--line); border-radius: 17px;
          background: #fff; box-shadow: 0 5px 20px #273d2510;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .wl-book:hover { transform: translateY(-2px); box-shadow: 0 10px 28px #273d2515; }
        .wl-cover {
          display: grid; place-items: center; flex-shrink: 0;
          width: 74px; height: 96px; border-radius: 9px;
          background: linear-gradient(145deg, #315f46, #173b2c);
          color: #f5e7c8; font-size: 31px;
          box-shadow: inset -5px 0 0 #ffffff13;
        }
        .wl-book-info { flex: 1; min-width: 0; }
        .wl-book-info h2 {
          margin: 0 0 7px; font: 700 20px/1.3 Georgia, serif;
          color: #253b2c; overflow-wrap: anywhere;
        }
        .wl-author { margin: 0; color: var(--muted); font-size: 13px; }
        .wl-access { margin-top: 12px; color: #54765a; font-size: 11px; font-weight: 800; }
        .wl-open {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; min-height: 43px; padding: 11px 16px;
          border: 0; border-radius: 10px; background: var(--green);
          color: white; font: inherit; font-size: 13px; font-weight: 750;
          cursor: pointer; white-space: nowrap; transition: background .18s ease;
        }
        .wl-open:hover { background: var(--green-dark); }
        .wl-open:disabled { opacity: .65; cursor: wait; }
        .wl-error {
          padding: 14px 16px; margin: 0 0 20px; border-radius: 11px;
          border: 1px solid #edc8c1; background: #fff0ed; color: #9c3328;
          font-size: 13px; line-height: 1.6;
        }
        .wl-empty {
          padding: 54px 24px; text-align: center; background: white;
          border: 1px solid var(--line); border-radius: 18px;
        }
        .wl-empty-icon {
          display: grid; place-items: center; width: 70px; height: 70px;
          margin: 0 auto 18px; border-radius: 50%; background: #edf2e9;
          font-size: 30px;
        }
        .wl-empty h2 { margin: 0 0 10px; font: 700 25px Georgia, serif; color: var(--green-dark); }
        .wl-empty p { margin: 0 auto 22px; max-width: 380px; color: var(--muted); line-height: 1.7; font-size: 14px; }
        .wl-skeleton {
          height: 137px; border-radius: 16px; border: 1px solid var(--line);
          background: linear-gradient(100deg, #fff 30%, #f1efe6 50%, #fff 70%);
          background-size: 200% 100%; animation: wl-shimmer 1.5s infinite;
        }
        @keyframes wl-shimmer { to { background-position-x: -200%; } }
        .wl-footer {
          padding-top: 28px; margin-top: 38px; border-top: 1px solid var(--line);
          display: flex; justify-content: space-between; flex-wrap: wrap;
          gap: 12px; color: var(--muted); font-size: 12px;
        }
        .wl-footer a { color: var(--green); text-decoration: none; font-weight: 700; }
        @media (max-width: 600px) {
          .wl-library { padding: 22px 14px 42px; }
          .wl-topbar { padding-bottom: 18px; }
          .wl-hero { padding-top: 32px; }
          .wl-book { gap: 13px; padding: 14px; flex-wrap: wrap; }
          .wl-cover { width: 59px; height: 79px; font-size: 25px; }
          .wl-book-info { flex: 1; }
          .wl-book-info h2 { font-size: 17px; }
          .wl-book-action { width: 100%; }
          .wl-open { width: 100%; }
          .wl-footer { flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wl-skeleton { animation: none; }
          .wl-book { transition: none; }
        }
      `}</style>

      <div className="wl-container">
        <header className="wl-topbar">
          <Link to="/" className="wl-brand" aria-label="Webli Literate home">
            Webli <span>Literate</span>
          </Link>
          <Link to="/" className="wl-back">← Browse books</Link>
        </header>

        <section className="wl-hero">
          <div className="wl-eyebrow">Your personal collection</div>
          <h1>My Purchases</h1>
          <p>
            Every book you own, all in one place. Open your books whenever
            you’re ready to read.
          </p>
          {rows && (
            <div className="wl-count">
              <span aria-hidden="true">▤</span>
              {rows.length} {rows.length === 1 ? 'book' : 'books'} in your library
            </div>
          )}
        </section>

        {err && (
          <div className="wl-error" role="alert">
            {err}
          </div>
        )}

        {!rows ? (
          <div className="wl-list" aria-label="Loading your library" aria-busy="true">
            <div className="wl-skeleton" />
            <div className="wl-skeleton" />
          </div>
        ) : rows.length === 0 ? (
          <section className="wl-empty">
            <div className="wl-empty-icon" aria-hidden="true">📚</div>
            <h2>Your library is waiting</h2>
            <p>
              You haven’t purchased any books yet. Discover something new
              and it’ll appear here after your purchase is confirmed.
            </p>
            <Link to="/" className="wl-open" style={{ textDecoration: 'none' }}>
              Explore the bookstore →
            </Link>
          </section>
        ) : (
          <div className="wl-list">
            {rows.map((purchase) => {
              const book = Array.isArray(purchase.books)
                ? purchase.books[0]
                : purchase.books;

              return (
                <article className="wl-book" key={purchase.book_id}>
                  <div className="wl-cover" aria-hidden="true">▤</div>

                  <div className="wl-book-info">
                    <h2>{book?.title || 'Untitled book'}</h2>
                    <p className="wl-author">
                      {book?.author ? `By ${book.author}` : 'Webli Literate edition'}
                    </p>
                    <div className="wl-access">✓ PURCHASE ACCESS ACTIVE</div>
                  </div>

                  <div className="wl-book-action">
                    <button
                      type="button"
                      className="wl-open"
                      disabled={openingId !== null}
                      onClick={() => openBook(purchase.book_id)}
                    >
                      {openingId === purchase.book_id
                        ? 'Preparing…'
                        : 'Read / Download ↗'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="wl-footer">
          <span>© {new Date().getFullYear()} Webli Literate</span>
          <span>
            Need help? <Link to="/contact">Contact support</Link>
          </span>
        </footer>
      </div>
    </main>
  );
}

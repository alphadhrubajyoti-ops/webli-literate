
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { inr, finalPaise } from '../lib/brand';

type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  original_price_paise: number;
  discount_percent: number | null;
  sale_price_paise: number | null;
};

type Category = {
  id: string;
  name: string;
};

function BookCard({ book }: { book: Book }) {
  const price = finalPaise(
    book.original_price_paise,
    book.discount_percent,
    book.sale_price_paise
  );

  const hasDiscount =
    Number(book.discount_percent) > 0 ||
    (book.sale_price_paise != null &&
      book.sale_price_paise < book.original_price_paise);

  return (
    <Link
      to={`/books/${book.id}`}
      className="book-card"
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className="book-cover">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            loading="lazy"
          />
        ) : (
          <div className="cover-placeholder">
            <span>W.</span>
            <small>{book.title}</small>
          </div>
        )}

        {hasDiscount && (
          <span className="discount-badge">Special price</span>
        )}
      </div>

      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="book-author">{book.author || 'Unknown author'}</p>

        <div className="book-price">
          <strong>{inr(price)}</strong>
          {hasDiscount && (
            <span className="old-price">
              {inr(book.original_price_paise)}
            </span>
          )}
        </div>

        <span className="view-book">
          View book <span aria-hidden="true">↗</span>
        </span>
      </div>
    </Link>
  );
}

function BookSection({
  title,
  subtitle,
  books,
}: {
  title: string;
  subtitle: string;
  books: Book[];
}) {
  if (!books.length) return null;

  return (
    <section className="book-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE COLLECTION</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <Link to="/books" className="text-link">
          Explore all books <span>→</span>
        </Link>
      </div>

      <div className="book-grid">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}

function BookSkeleton() {
  return (
    <div className="book-skeleton" aria-hidden="true">
      <div className="skeleton-cover" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [featured, setFeatured] = useState<Book[]>([]);
  const [recent, setRecent] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHome() {
      setLoading(true);
      setError(false);

      const fields =
        'id,title,author,cover_url,original_price_paise,discount_percent,sale_price_paise';

      const base = () =>
        supabase
          .from('books')
          .select(fields)
          .eq('published', true)
          .eq('archived', false);

      const [featuredResult, recentResult, categoryResult] =
        await Promise.all([
          base()
            .eq('featured', true)
            .limit(8),

          base()
            .order('created_at', { ascending: false })
            .limit(8),

          supabase
            .from('categories')
            .select('id,name')
            .order('name'),
        ]);

      if (!active) return;

      if (featuredResult.error || recentResult.error || categoryResult.error) {
        setError(true);
      }

      setFeatured(featuredResult.data ?? []);
      setRecent(recentResult.data ?? []);
      setCategories(categoryResult.data ?? []);
      setLoading(false);
    }

    loadHome();

    return () => {
      active = false;
    };
  }, []);

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const query = search.trim();

    navigate(
      query ? `/books?q=${encodeURIComponent(query)}` : '/books'
    );
  }

  return (
    <main className="storefront">
      <style>{`
        .storefront {
          --ink: #20251f;
          --muted: #74786e;
          --green: #244b38;
          --green-light: #e8eee7;
          --paper: #fbfaf6;
          --line: #e9e7df;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .storefront * { box-sizing: border-box; }

        .storefront a {
          color: inherit;
          text-decoration: none;
        }

        .store-container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .store-topline {
          background: var(--green);
          color: white;
          padding: 10px 20px;
          text-align: center;
          font-size: 12px;
          letter-spacing: .5px;
        }

        .store-header {
          background: rgba(251,250,246,.96);
          border-bottom: 1px solid var(--line);
        }

        .store-nav {
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .store-logo {
          display: flex;
          align-items: center;
          gap: 11px;
          flex-shrink: 0;
        }

        .logo-mark {
          width: 42px;
          height: 42px;
          background: var(--green);
          color: white;
          display: grid;
          place-items: center;
          border-radius: 8px;
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 700;
        }

        .logo-name {
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -.8px;
        }

        .logo-caption {
          display: block;
          margin-top: 2px;
          color: var(--muted);
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 27px;
          font-size: 13px;
          color: #52574e;
        }

        .nav-links a:hover, .text-link:hover {
          color: #3f7958;
        }

        .nav-cta {
          padding: 12px 18px;
          background: var(--green);
          color: white !important;
          border-radius: 5px;
          font-weight: 600;
          white-space: nowrap;
        }

        .hero {
          padding: 68px 0 54px;
          overflow: hidden;
        }

        .hero-inner {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          align-items: center;
          gap: 44px;
        }

        .eyebrow {
          display: inline-block;
          color: #59745c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.3px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 18px 0;
          max-width: 630px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(42px, 5.2vw, 68px);
          font-weight: 500;
          letter-spacing: -2.7px;
          line-height: 1.06;
        }

        .hero h1 em {
          color: #52745a;
          font-weight: 400;
        }

        .hero-copy {
          max-width: 480px;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.9;
        }

        .search-form {
          display: flex;
          gap: 8px;
          max-width: 510px;
          margin-top: 28px;
          padding: 6px;
          border: 1px solid #e2e2d8;
          border-radius: 7px;
          background: white;
          box-shadow: 0 8px 28px rgba(30,45,31,.045);
        }

        .search-form input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          padding: 12px;
          color: var(--ink);
          background: transparent;
          font: inherit;
          font-size: 13px;
        }

        .search-form input:focus-visible {
          outline: 2px solid #8ba890;
          outline-offset: -2px;
          border-radius: 3px;
        }

        .search-form button {
          flex-shrink: 0;
          border: 0;
          border-radius: 4px;
          padding: 0 19px;
          background: var(--green);
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .search-form button:hover, .nav-cta:hover {
          background: #345e45;
        }

        .hero-note {
          margin-top: 16px;
          color: var(--muted);
          font-size: 11px;
        }

        .hero-art {
          position: relative;
          min-height: 355px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #e9ece2;
          overflow: hidden;
        }

        .hero-art::before, .hero-art::after {
          content: "";
          position: absolute;
          border: 1px solid rgba(36,75,56,.12);
          border-radius: 50%;
        }

        .hero-art::before {
          width: 330px;
          height: 330px;
        }

        .hero-art::after {
          width: 250px;
          height: 250px;
        }

        .art-book {
          position: relative;
          z-index: 1;
          width: 176px;
          height: 242px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #f8f3e7;
          background: #31523c;
          border-radius: 3px 9px 9px 3px;
          box-shadow: 15px 18px 30px rgba(27,45,30,.23),
            inset 5px 0 0 rgba(255,255,255,.08);
          transform: rotate(-7deg);
        }

        .art-book small {
          font-size: 8px;
          letter-spacing: 2px;
        }

        .art-book strong {
          font-family: Georgia, serif;
          font-size: 31px;
          line-height: 1.05;
          font-weight: 500;
        }

        .art-book span {
          font-size: 10px;
          letter-spacing: 1px;
        }

        .art-book.second {
          position: absolute;
          margin-left: 112px;
          width: 144px;
          height: 205px;
          background: #c18b62;
          transform: rotate(11deg);
          z-index: 0;
        }

        .art-note {
          position: absolute;
          bottom: 22px;
          right: 22px;
          z-index: 2;
          padding: 12px 16px;
          background: white;
          border-radius: 5px;
          font-size: 11px;
          box-shadow: 0 6px 20px #20251f0c;
        }

        .category-strip {
          padding: 23px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          background: #fffefa;
        }

        .category-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .category-label {
          margin-right: 8px;
          font-size: 11px;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .category-chip {
          padding: 9px 14px;
          border: 1px solid #e4e5dc;
          border-radius: 5px;
          font-size: 12px;
          background: white;
          transition: background .2s, border-color .2s;
        }

        .category-chip:hover {
          background: var(--green-light);
          border-color: #cad7c9;
        }

        .book-section {
          padding: 64px 0 10px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }

        .section-heading h2 {
          margin: 8px 0;
          font-family: Georgia, serif;
          font-weight: 500;
          letter-spacing: -1px;
          font-size: clamp(28px, 3vw, 38px);
        }

        .section-heading p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
        }

        .text-link {
          padding-bottom: 5px;
          color: var(--green);
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .book-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 25px 20px;
        }

        .book-card {
          min-width: 0;
          overflow: hidden;
          background: white;
          border: 1px solid #eeece5;
          border-radius: 7px;
          transition: transform .22s ease, box-shadow .22s ease;
        }

        .book-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 13px 28px rgba(30,45,31,.08);
        }

        .book-cover {
          position: relative;
          overflow: hidden;
          background: #eeeee6;
          aspect-ratio: 3 / 3.8;
        }

        .book-cover img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .3s ease;
        }

        .book-card:hover .book-cover img {
          transform: scale(1.035);
        }

        .discount-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 6px 8px;
          background: #fffefa;
          color: var(--green);
          border-radius: 3px;
          font-size: 9px;
          font-weight: 800;
        }

        .cover-placeholder {
          height: 100%;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #e7eae0;
          color: #31523c;
          font-family: Georgia, serif;
        }

        .cover-placeholder span { font-size: 27px; }
        .cover-placeholder small { font-size: 17px; line-height: 1.3; }

        .book-info { padding: 15px; }

        .book-info h3 {
          margin: 0;
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          min-height: 42px;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 700;
        }

        .book-author {
          margin: 5px 0 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--muted);
          font-size: 11px;
        }

        .book-price {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .book-price strong {
          color: var(--green);
          font-size: 16px;
        }

        .old-price {
          color: #989a91;
          font-size: 11px;
          text-decoration: line-through;
        }

        .view-book {
          display: block;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px solid #f0eee8;
          color: var(--green);
          font-size: 11px;
          font-weight: 700;
        }

        .view-book span { float: right; }

        .loading-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .skeleton-cover {
          aspect-ratio: 3 / 3.8;
          background: #eae9e1;
          border-radius: 5px;
        }

        .skeleton-line {
          height: 12px;
          margin-top: 12px;
          width: 85%;
          border-radius: 4px;
          background: #eae9e1;
        }

        .skeleton-line.short { width: 55%; }

        .book-skeleton {
          animation: breathe 1.3s ease-in-out infinite alternate;
        }

        @keyframes breathe {
          from { opacity: .6; }
          to { opacity: 1; }
        }

        .empty-state {
          padding: 36px 20px;
          border: 1px dashed #d8d9cf;
          border-radius: 7px;
          text-align: center;
          color: var(--muted);
          font-size: 13px;
        }

        .error-state {
          margin: 25px 0;
          padding: 16px;
          border: 1px solid #ead9c7;
          border-radius: 6px;
          background: #fff9f1;
          color: #77552f;
          font-size: 13px;
        }

        .how-section {
          margin-top: 70px;
          padding: 55px 0;
          background: #eef0e8;
        }

        .how-heading { text-align: center; }

        .how-heading h2 {
          margin: 10px 0;
          font-family: Georgia, serif;
          font-weight: 500;
          font-size: 36px;
          letter-spacing: -1px;
        }

        .how-heading p {
          color: var(--muted);
          font-size: 13px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 34px;
        }

        .step-card {
          padding: 25px;
          background: rgba(255,255,255,.78);
          border: 1px solid #e4e6dc;
          border-radius: 6px;
        }

        .step-number {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          background: var(--green-light);
          color: var(--green);
          border-radius: 5px;
          font-size: 12px;
          font-weight: 800;
        }

        .step-card h3 {
          margin: 17px 0 8px;
          font-family: Georgia, serif;
          font-size: 21px;
          font-weight: 500;
        }

        .step-card p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.8;
        }

        .store-footer {
          padding: 28px 0;
          background: #202d25;
          color: #f8f7ef;
        }

        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .footer-inner p {
          margin: 0;
          color: #c2c9bf;
          font-size: 11px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          font-size: 11px;
        }

        .footer-links a:hover { color: #d4dfc9; }

        @media (max-width: 850px) {
          .hero-inner { grid-template-columns: 1fr .8fr; gap: 22px; }
          .hero-art { min-height: 300px; }
          .art-book { transform: scale(.85) rotate(-7deg); }
          .art-book.second { transform: scale(.85) rotate(11deg); }
          .book-grid, .loading-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .nav-links { gap: 15px; }
        }

        @media (max-width: 620px) {
          .store-container { width: calc(100% - 32px); }
          .store-topline { font-size: 10px; }
          .store-nav { min-height: 68px; gap: 10px; }
          .logo-mark { width: 36px; height: 36px; font-size: 21px; }
          .logo-name { font-size: 20px; }
          .logo-caption { font-size: 8px; letter-spacing: 1.5px; }
          .nav-links { gap: 12px; font-size: 11px; }
          .nav-links .nav-optional { display: none; }
          .nav-cta { padding: 10px 11px; font-size: 11px; }
          .hero { padding: 38px 0 30px; }
          .hero-inner { grid-template-columns: 1fr; gap: 27px; }
          .hero h1 { font-size: clamp(42px, 11vw, 57px); letter-spacing: -1.8px; }
          .hero-copy { font-size: 13px; }
          .hero-art { min-height: 260px; }
          .art-book { transform: scale(.78) rotate(-7deg); }
          .art-book.second { transform: scale(.78) rotate(11deg); }
          .category-row { gap: 8px; }
          .category-label { width: 100%; }
          .category-chip { padding: 8px 10px; font-size: 11px; }
          .book-section { padding-top: 44px; }
          .section-heading { align-items: flex-start; }
          .section-heading h2 { font-size: 29px; }
          .section-heading p { font-size: 11px; line-height: 1.6; }
          .text-link { padding-top: 19px; font-size: 10px; }
          .book-grid, .loading-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 11px; }
          .book-info { padding: 11px; }
          .book-info h3 { font-size: 12px; min-height: 36px; }
          .book-price strong { font-size: 14px; }
          .old-price { font-size: 10px; }
          .view-book { font-size: 10px; }
          .how-section { margin-top: 48px; padding: 42px 0; }
          .how-heading h2 { font-size: 30px; }
          .steps-grid { grid-template-columns: 1fr; gap: 12px; margin-top: 25px; }
          .step-card { padding: 20px; }
          .footer-inner { align-items: flex-start; flex-direction: column; }
          .footer-links { gap: 14px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .storefront *, .storefront *::before, .storefront *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="store-topline">
        A little more knowledge, one book at a time.
      </div>

      <header className="store-header">
        <div className="store-container store-nav">
          <Link to="/" className="store-logo" aria-label="Webli Literate home">
            <span className="logo-mark">W.</span>
            <span>
              <span className="logo-name">Webli Literate</span>
              <span className="logo-caption">Your digital bookshelf</span>
            </span>
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <Link to="/books">Books</Link>
            <Link className="nav-optional" to="/books">Collections</Link>
            <Link className="nav-optional" to="/purchases">My Library</Link>
            <Link to="/login" className="nav-cta">Sign in ↗</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="store-container hero-inner">
          <div>
            <span className="eyebrow">A WORLD OF STORIES & IDEAS</span>

            <h1>
              Find your next
              <br />
              <em>great read.</em>
            </h1>

            <p className="hero-copy">
              Explore a thoughtfully curated collection of digital books.
              Discover new ideas, revisit your favourite subjects, and build
              a library that goes wherever you do.
            </p>

            <form className="search-form" onSubmit={submitSearch}>
              <input
                name="q"
                aria-label="Search by title or author"
                placeholder="Search titles, authors, and topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">Search ↗</button>
            </form>

            <p className="hero-note">
              Discover books · Purchase securely · Read at your own pace
            </p>
          </div>

          <div className="hero-art" aria-label="Decorative illustration of books">
            <div className="art-book second">
              <small>EXPLORE</small>
              <strong>New<br />Ideas</strong>
              <span>YOUR NEXT CHAPTER</span>
            </div>

            <div className="art-book">
              <small>WEBLI LITERATE</small>
              <strong>The<br />Art of<br />Reading</strong>
              <span>KNOWLEDGE AWAITS</span>
            </div>

            <div className="art-note">A new chapter starts here ↗</div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="category-strip">
          <div className="store-container category-row">
            <span className="category-label">Browse by interest</span>

            {categories.map((category) => (
              <Link
                key={category.id}
                className="category-chip"
                to={`/books?cat=${encodeURIComponent(category.id)}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="store-container">
        {error && (
          <div className="error-state" role="status">
            Some store information could not be loaded. Please try refreshing
            the page.
          </div>
        )}

        {loading ? (
          <>
            <section className="book-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THE COLLECTION</span>
                  <h2>Featured books</h2>
                  <p>Discover something worth reading.</p>
                </div>
              </div>

              <div className="loading-grid">
                {Array.from({ length: 4 }, (_, i) => (
                  <BookSkeleton key={i} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <BookSection
              title="Featured books"
              subtitle="Handpicked reads to inspire your next discovery."
              books={featured}
            />

            <BookSection
              title="Fresh on the shelf"
              subtitle="Take a look at the latest additions to our library."
              books={recent}
            />

            {!featured.length && !recent.length && (
              <div className="empty-state">
                <h3>Your next favourite book is on its way.</h3>
                <p>There are no published books to display right now.</p>
                <Link className="text-link" to="/books">
                  Browse the catalogue →
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <section className="how-section">
        <div className="store-container">
          <div className="how-heading">
            <span className="eyebrow">SIMPLE BY DESIGN</span>
            <h2>Your next read, in three steps.</h2>
            <p>A straightforward way to discover and enjoy digital books.</p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <h3>Discover</h3>
              <p>
                Explore the catalogue, browse categories, and find books that
                match your interests.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">02</span>
              <h3>Purchase securely</h3>
              <p>
                Sign in to your account and follow the available checkout
                process to purchase a book.
              </p>
            </article>

            <article className="step-card">
              <span className="step-number">03</span>
              <h3>Build your library</h3>
              <p>
                Visit My Library to access your purchased books and use the
                reading or download options provided.
              </p>
            </article>
          </div>
        </div>
      </section>

      <footer className="store-footer">
        <div className="store-container footer-inner">
          <p>© {new Date().getFullYear()} Webli Literate. All rights reserved.</p>

          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/books">Browse books</Link>
            <Link to="/purchases">My Library</Link>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

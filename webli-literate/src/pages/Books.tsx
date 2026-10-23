
import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { inr, finalPaise, waLink } from '../lib/brand';
import { cartIds, setCart } from '../lib/cart';

type Category = {
  id: string;
  name: string;
};

type Book = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  original_price_paise: number;
  discount_percent: number | null;
  sale_price_paise: number | null;
  categories: { name: string } | { name: string }[] | null;
  finalPrice: number;
};

const PAGE_SIZE = 24;

export default function Books() {
  const [params, setParams] = useSearchParams();

  const query = params.get('q') || '';
  const category = params.get('cat') || '';
  const sort = params.get('sort') || 'new';
  const maxPrice = params.get('max') || '';

  const [searchInput, setSearchInput] = useState(query);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [books, setBooks] = useState<Book[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    setSearchInput(query);
    setMaxInput(maxPrice);
    setLimit(PAGE_SIZE);
  }, [query, maxPrice, category, sort]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      const { data, error: categoryError } = await supabase
        .from('categories')
        .select('id,name')
        .order('name');

      if (!active) return;

      if (categoryError) {
        console.error('Could not load categories:', categoryError.message);
        return;
      }

      setCategories(data ?? []);
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      setBooks(null);
      setError('');

      let request = supabase
        .from('books')
        .select(
          'id,title,author,cover_url,original_price_paise,discount_percent,sale_price_paise,categories(name)'
        )
        .eq('published', true)
        .eq('archived', false)
        .limit(limit);

      if (category) {
        request = request.eq('category_id', category);
      }

      if (query.trim()) {
        // Remove characters that can interfere with PostgREST filter syntax.
        const safeQuery = query
          .trim()
          .replace(/[,%()\\]/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 100);

        if (safeQuery) {
          request = request.or(
            `title.ilike.%${safeQuery}%,author.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`
          );
        }
      }

      if (sort === 'title') {
        request = request.order('title', { ascending: true });
      } else {
        request = request.order('created_at', { ascending: false });
      }

      const { data, error: queryError } = await request;

      if (!active) return;

      if (queryError) {
        console.error('Could not load books:', queryError.message);
        setError('We could not load the books. Please try again.');
        setBooks([]);
        return;
      }

      let result: Book[] = (data ?? []).map((book: any) => ({
        ...book,
        finalPrice: finalPaise(
          book.original_price_paise,
          book.discount_percent,
          book.sale_price_paise
        ),
      }));

      const max = Number(maxPrice);

      if (maxPrice.trim() !== '' && Number.isFinite(max) && max >= 0) {
        result = result.filter((book) => book.finalPrice <= max * 100);
      }

      if (sort === 'price') {
        result.sort((a, b) => a.finalPrice - b.finalPrice);
      }

      setBooks(result);
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, [query, category, sort, maxPrice, limit]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);

    if (value.trim()) {
      next.set(key, value.trim());
    } else {
      next.delete(key);
    }

    setParams(next);
  };

  const clearFilters = () => {
    setParams({});
    setSearchInput('');
    setMaxInput('');
    setLimit(PAGE_SIZE);
    setCartMessage('');
  };

  const addToCart = (bookId: string) => {
    const current = cartIds();

    if (current.includes(bookId)) {
      setCartMessage('This book is already in your cart.');
      return;
    }

    setCart([...current, bookId]);
    setCartMessage('Book added to your cart.');

    window.setTimeout(() => setCartMessage(''), 3000);
  };

  const categoryName = (book: Book) => {
    const value = book.categories;
    return Array.isArray(value) ? value[0]?.name : value?.name;
  };

  const hasFilters = Boolean(query || category || maxPrice);

  const activeCategory = useMemo(
    () => categories.find((item) => item.id === category)?.name,
    [categories, category]
  );

  return (
    <main className="wl-books-page">
      <style>{`
        .wl-books-page {
          --books-green: #24533d;
          --books-dark: #173c2c;
          --books-cream: #faf8f1;
          --books-line: #e7e5da;
          --books-muted: #777d73;
          min-height: 75vh;
          padding: 30px 20px 65px;
          background: var(--books-cream);
          color: #263329;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .wl-books-page * { box-sizing: border-box; }
        .wl-books-container { max-width: 1200px; margin: 0 auto; }

        .wl-books-breadcrumb {
          display: flex; flex-wrap: wrap; gap: 9px;
          align-items: center; margin-bottom: 26px;
          color: var(--books-muted); font-size: 12px;
        }

        .wl-books-breadcrumb a {
          color: var(--books-green); text-decoration: none; font-weight: 700;
        }

        .wl-books-hero {
          position: relative; overflow: hidden;
          padding: clamp(27px, 5vw, 48px);
          border-radius: 20px;
          background: linear-gradient(120deg, #173c2c, #315e43);
          color: #fffdf6;
        }

        .wl-books-hero::after {
          content: "BOOKS";
          position: absolute; right: -8px; bottom: -26px;
          font: 900 clamp(75px, 15vw, 155px)/1 Georgia, serif;
          letter-spacing: -8px; color: #ffffff09;
          pointer-events: none;
        }

        .wl-books-eyebrow {
          position: relative; z-index: 1;
          font-size: 11px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 2.2px;
          color: #e6cf9f;
        }

        .wl-books-hero h1 {
          position: relative; z-index: 1;
          max-width: 650px; margin: 12px 0;
          font: 700 clamp(34px, 6vw, 54px)/1.08 Georgia, serif;
          letter-spacing: -1.5px;
        }

        .wl-books-hero p {
          position: relative; z-index: 1;
          max-width: 540px; margin: 0;
          color: #e3eae0; font-size: 14px; line-height: 1.8;
        }

        .wl-books-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin: 29px 0 18px;
        }

        .wl-books-toolbar h2 {
          margin: 0; font: 700 25px Georgia, serif; color: var(--books-dark);
        }

        .wl-books-count { color: var(--books-muted); font-size: 12px; margin-top: 5px; }

        .wl-books-filters {
          display: grid;
          grid-template-columns: minmax(200px, 1fr) minmax(145px, 180px) minmax(135px, 160px) 115px auto;
          gap: 10px; align-items: center;
          padding: 14px; border: 1px solid var(--books-line);
          border-radius: 15px; background: #fff;
        }

        .wl-books-search { position: relative; min-width: 0; }

        .wl-books-search input,
        .wl-books-filters select,
        .wl-books-price-input {
          width: 100%; min-width: 0; min-height: 44px;
          padding: 11px 12px; border: 1px solid #e3e5dc;
          border-radius: 9px; outline: none; background: #fff;
          color: #263329; font: inherit; font-size: 12px;
        }

        .wl-books-search input:focus,
        .wl-books-filters select:focus,
        .wl-books-price-input:focus {
          border-color: #789b7d;
          box-shadow: 0 0 0 3px #24533d12;
        }

        .wl-books-filter-label {
          display: block; margin-bottom: 6px;
          color: var(--books-muted); font-size: 10px; font-weight: 750;
        }

        .wl-books-filter-cell { min-width: 0; }

        .wl-books-clear {
          min-height: 43px; padding: 10px 12px;
          border: 1px solid #dfe5da; border-radius: 9px;
          background: #f7faf5; color: var(--books-green);
          font: inherit; font-size: 12px; font-weight: 750;
          cursor: pointer; white-space: nowrap;
        }

        .wl-books-clear:hover { background: #eaf1e7; }

        .wl-books-feedback {
          margin: 15px 0; padding: 12px 15px; border-radius: 10px;
          background: #edf3ec; color: var(--books-green); font-size: 13px;
        }

        .wl-books-error {
          margin: 16px 0; padding: 15px; border-radius: 10px;
          border: 1px solid #edc8c1; background: #fff0ed;
          color: #96382e; font-size: 13px; line-height: 1.6;
        }

        .wl-books-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px; margin-top: 22px;
        }

        .wl-book-card {
          display: flex; flex-direction: column; min-width: 0;
          overflow: hidden; border: 1px solid var(--books-line);
          border-radius: 15px; background: white;
          box-shadow: 0 4px 16px #263b2910;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .wl-book-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px #263b2917;
        }

        .wl-book-image-wrap {
          position: relative; overflow: hidden;
          aspect-ratio: 3 / 3.7; background: #eeeadd;
        }

        .wl-book-cover {
          display: block; width: 100%; height: 100%;
          object-fit: cover; transition: transform .3s ease;
        }

        .wl-book-card:hover .wl-book-cover { transform: scale(1.025); }

        .wl-book-placeholder {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%;
          background: linear-gradient(145deg, #315f46, #173b2c);
          color: #f4e5c5; font: 700 42px Georgia, serif;
        }

        .wl-book-discount {
          position: absolute; top: 11px; left: 11px;
          padding: 6px 8px; border-radius: 6px;
          background: #fff5dc; color: #825a22;
          font-size: 10px; font-weight: 850;
        }

        .wl-book-body {
          display: flex; flex-direction: column; flex: 1;
          padding: 15px;
        }

        .wl-book-category {
          color: #8b754d; font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 1px;
        }

        .wl-book-title {
          display: -webkit-box; overflow: hidden;
          -webkit-box-orient: vertical; -webkit-line-clamp: 2;
          min-height: 47px; margin: 8px 0 5px;
          font: 700 18px/1.3 Georgia, serif;
          color: #263b2d; overflow-wrap: anywhere;
        }

        .wl-book-title a { color: inherit; text-decoration: none; }
        .wl-book-title a:hover { color: var(--books-green); }

        .wl-book-author {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin: 0 0 13px; color: var(--books-muted); font-size: 12px;
        }

        .wl-book-price {
          display: flex; flex-wrap: wrap; align-items: baseline;
          gap: 7px; margin-top: auto; padding-top: 10px;
        }

        .wl-book-price-current {
          color: var(--books-green); font-size: 17px; font-weight: 850;
        }

        .wl-book-price-original {
          color: #96998f; font-size: 11px; text-decoration: line-through;
        }

        .wl-book-actions {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px; margin-top: 14px;
        }

        .wl-book-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 39px; padding: 9px 8px;
          border: 1px solid var(--books-green); border-radius: 8px;
          font: inherit; font-size: 11px; font-weight: 800;
          text-align: center; text-decoration: none; cursor: pointer;
          transition: background .18s ease, color .18s ease;
        }

        .wl-book-btn.primary { background: var(--books-green); color: white; }
        .wl-book-btn.primary:hover { background: var(--books-dark); }
        .wl-book-btn.secondary { background: white; color: var(--books-green); }
        .wl-book-btn.secondary:hover { background: #edf3ec; }

        .wl-books-empty {
          grid-column: 1 / -1; padding: 50px 20px;
          text-align: center; border: 1px solid var(--books-line);
          border-radius: 15px; background: white;
        }

        .wl-books-empty h3 { margin: 0 0 10px; font: 700 25px Georgia, serif; }
        .wl-books-empty p { margin: 0 0 20px; color: var(--books-muted); font-size: 13px; }

        .wl-books-skeleton {
          overflow: hidden; border: 1px solid var(--books-line);
          border-radius: 15px; background: white;
        }

        .wl-books-skeleton-image {
          aspect-ratio: 3 / 3.7;
          background: linear-gradient(100deg, #f1efe6 30%, #fff 50%, #f1efe6 70%);
          background-size: 200% 100%; animation: wl-books-shimmer 1.4s infinite;
        }

        .wl-books-skeleton-line {
          height: 12px; margin: 14px; border-radius: 6px;
          background: #efeee6;
        }

        @keyframes wl-books-shimmer { to { background-position-x: -200%; } }

        .wl-books-more { display: flex; justify-content: center; margin-top: 30px; }

        .wl-books-more button {
          min-height: 45px; padding: 12px 22px;
          border: 1px solid #d8e2d5; border-radius: 10px;
          background: white; color: var(--books-green);
          font: inherit; font-size: 13px; font-weight: 800; cursor: pointer;
        }

        .wl-books-more button:hover { background: #edf3ec; }

        @media (max-width: 1050px) {
          .wl-books-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .wl-books-filters {
            grid-template-columns: minmax(180px, 1fr) minmax(140px, 1fr) minmax(130px, 1fr);
          }
          .wl-books-clear { grid-column: auto; }
        }

        @media (max-width: 700px) {
          .wl-books-page { padding: 20px 13px 45px; }
          .wl-books-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .wl-books-filters { grid-template-columns: 1fr 1fr; gap: 9px; padding: 11px; }
          .wl-books-search { grid-column: 1 / -1; }
          .wl-books-clear { width: 100%; }
          .wl-book-body { padding: 11px; }
          .wl-book-title { font-size: 16px; min-height: 42px; }
          .wl-book-price-current { font-size: 15px; }
          .wl-book-actions { grid-template-columns: 1fr; }
          .wl-books-hero { border-radius: 15px; }
        }

        @media (max-width: 360px) {
          .wl-books-grid { grid-template-columns: 1fr; }
          .wl-book-image-wrap { aspect-ratio: 3 / 3.3; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wl-books-page * { transition: none !important; }
          .wl-books-skeleton-image { animation: none; }
        }
      `}</style>

      <div className="wl-books-container">
        <div className="wl-books-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Explore Books</span>
        </div>

        <section className="wl-books-hero">
          <div className="wl-books-eyebrow">Your next chapter starts here</div>
          <h1>Discover books worth keeping.</h1>
          <p>
            Explore our collection, find your next favourite read, and
            build your personal digital library with Webli Literate.
          </p>
        </section>

        <div className="wl-books-toolbar">
          <div>
            <h2>Explore the collection</h2>
            <div className="wl-books-count">
              {books === null
                ? 'Finding your next read…'
                : `${books.length}${books.length >= limit ? '+' : ''} books shown`}
              {activeCategory ? ` · ${activeCategory}` : ''}
            </div>
          </div>
        </div>

        <form
          className="wl-books-filters"
          onSubmit={(event) => {
            event.preventDefault();
            const next = new URLSearchParams(params);
            searchInput.trim()
              ? next.set('q', searchInput.trim())
              : next.delete('q');

            const max = maxInput.trim();
            if (max && Number.isFinite(Number(max)) && Number(max) >= 0) {
              next.set('max', max);
            } else {
              next.delete('max');
            }

            setParams(next);
          }}
        >
          <div className="wl-books-search">
            <label className="wl-books-filter-label" htmlFor="books-search">
              Search books
            </label>
            <input
              id="books-search"
              type="search"
              value={searchInput}
              maxLength={100}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Title, author or keyword…"
            />
          </div>

          <div className="wl-books-filter-cell">
            <label className="wl-books-filter-label" htmlFor="books-category">
              Category
            </label>
            <select
              id="books-category"
              value={category}
              onChange={(event) => updateParam('cat', event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="wl-books-filter-cell">
            <label className="wl-books-filter-label" htmlFor="books-sort">
              Sort by
            </label>
            <select
              id="books-sort"
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
            >
              <option value="new">Newest first</option>
              <option value="title">Title A–Z</option>
              <option value="price">Price: low to high</option>
            </select>
          </div>

          <div className="wl-books-filter-cell">
            <label className="wl-books-filter-label" htmlFor="books-max">
              Maximum price (₹)
            </label>
            <input
              id="books-max"
              className="wl-books-price-input"
              type="number"
              min="0"
              step="1"
              value={maxInput}
              onChange={(event) => setMaxInput(event.target.value)}
              placeholder="Any price"
            />
          </div>

          <button className="wl-books-clear" type="button" onClick={clearFilters}>
            Clear filters
          </button>

          <button
            type="submit"
            className="wl-book-btn primary"
            style={{ gridColumn: '1 / -1', justifySelf: 'start', paddingInline: 20 }}
          >
            Search & Apply Filters
          </button>
        </form>

        {cartMessage && (
          <div className="wl-books-feedback" role="status">
            {cartMessage}{' '}
            <Link
              to="/cart"
              style={{ color: 'inherit', fontWeight: 800, marginLeft: 5 }}
            >
              View cart →
            </Link>
          </div>
        )}

        {error && (
          <div className="wl-books-error" role="alert">
            {error}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginLeft: 12,
                border: 0,
                background: 'transparent',
                color: 'inherit',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {books === null && !error && (
          <div className="wl-books-grid" aria-busy="true" aria-label="Loading books">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="wl-books-skeleton" key={index}>
                <div className="wl-books-skeleton-image" />
                <div className="wl-books-skeleton-line" />
                <div className="wl-books-skeleton-line" style={{ width: '55%' }} />
              </div>
            ))}
          </div>
        )}

        {books && !error && books.length === 0 && (
          <section className="wl-books-empty">
            <h3>No books found</h3>
            <p>
              {hasFilters
                ? 'Try a different search or remove some filters.'
                : 'New books will appear here when they are available.'}
            </p>
            {hasFilters && (
              <button className="wl-book-btn primary" onClick={clearFilters}>
                Clear all filters
              </button>
            )}
          </section>
        )}

        {books && books.length > 0 && (
          <>
            <div className="wl-books-grid">
              {books.map((book) => {
                const discounted = book.finalPrice < book.original_price_paise;
                const categoryLabel = categoryName(book);

                return (
                  <article className="wl-book-card" key={book.id}>
                    <Link
                      to={`/books/${book.id}`}
                      className="wl-book-image-wrap"
                      aria-label={`View ${book.title}`}
                      style={{ textDecoration: 'none' }}
                    >
                      {book.cover_url ? (
                        <img
                          className="wl-book-cover"
                          src={book.cover_url}
                          alt={`Cover of ${book.title}`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}

                      {!book.cover_url && (
                        <div className="wl-book-placeholder" aria-hidden="true">
                          W
                        </div>
                      )}

                      {discounted && book.discount_percent != null && book.discount_percent > 0 && (
                        <span className="wl-book-discount">
                          {book.discount_percent}% OFF
                        </span>
                      )}
                    </Link>

                    <div className="wl-book-body">
                      {categoryLabel && (
                        <div className="wl-book-category">{categoryLabel}</div>
                      )}

                      <h3 className="wl-book-title">
                        <Link to={`/books/${book.id}`}>{book.title}</Link>
                      </h3>

                      <p className="wl-book-author">
                        {book.author || 'Independent publication'}
                      </p>

                      <div className="wl-book-price">
                        <span className="wl-book-price-current">
                          {inr(book.finalPrice)}
                        </span>
                        {discounted && (
                          <span className="wl-book-price-original">
                            {inr(book.original_price_paise)}
                          </span>
                        )}
                      </div>

                      <div className="wl-book-actions">
                        <Link
                          className="wl-book-btn secondary"
                          to={`/books/${book.id}`}
                        >
                          Details
                        </Link>

                        <button
                          type="button"
                          className="wl-book-btn primary"
                          onClick={() => addToCart(book.id)}
                        >
                          Add to cart
                        </button>
                      </div>

                      <a
                        href={waLink(
                          `Hi, I want to buy this book: ${book.title}. Please share the purchase details.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          marginTop: 12,
                          color: '#52745a',
                          fontSize: 11,
                          fontWeight: 750,
                          textAlign: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        Ask about this book on WhatsApp ↗
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            {books.length >= limit && (
              <div className="wl-books-more">
                <button
                  type="button"
                  onClick={() => setLimit((current) => current + PAGE_SIZE)}
                >
                  Load more books ↓
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

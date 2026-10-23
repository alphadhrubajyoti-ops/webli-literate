
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { inr, finalPaise, waLink } from '../lib/brand';
import { cartIds, setCart } from '../lib/cart';

type Book = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  original_price_paise: number;
  discount_percent: number;
  sale_price_paise: number | null;
  description: string | null;
  language: string | null;
  page_count: number | null;
  purchasable: boolean;
  preview_urls: string[] | null;
  categories: { name: string } | { name: string }[] | null;
};

const colors = {
  background: '#F8F6F0',
  surface: '#FFFFFF',
  ink: '#202B24',
  muted: '#777D75',
  green: '#245C43',
  greenDark: '#19432F',
  border: '#E7E5DC',
  gold: '#B78A43',
};

const buttonStyle = {
  minHeight: 48,
  borderRadius: 9,
  padding: '12px 18px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background 160ms ease',
};

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState('');
  const [coverFailed, setCoverFailed] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBook() {
      setLoading(true);
      setError('');
      setBook(null);
      setCoverFailed(false);

      if (!id) {
        setError('The requested book could not be found.');
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('books')
        .select(
          [
            'id',
            'title',
            'author',
            'cover_url',
            'original_price_paise',
            'discount_percent',
            'sale_price_paise',
            'description',
            'language',
            'page_count',
            'purchasable',
            'preview_urls',
            'categories(name)',
          ].join(',')
        )
        .eq('id', id)
        .eq('published', true)
        .eq('archived', false)
        .maybeSingle();

      if (!active) return;

      if (queryError) {
        setError('We could not load this book. Please try again.');
      } else if (!data) {
        setError('This book is not available.');
      } else {
        setBook(data as unknown as Book);
      }

      setLoading(false);
    }

    loadBook();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!zoom) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoom('');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          <div className="book-detail-spinner" />
          <p style={{ color: colors.muted }}>Finding your next read…</p>
          <style>{`
            .book-detail-spinner {
              width: 34px;
              height: 34px;
              border: 3px solid #E7E5DC;
              border-top-color: #245C43;
              border-radius: 50%;
              animation: book-spin .8s linear infinite;
            }
            @keyframes book-spin {
              to { transform: rotate(360deg); }
            }
            @media (prefers-reduced-motion: reduce) {
              .book-detail-spinner { animation: none; }
            }
          `}</style>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main style={pageStyle}>
        <section style={errorCard}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>📚</div>
          <h1 style={{ color: colors.ink, fontFamily: 'Georgia, serif' }}>
            Book unavailable
          </h1>
          <p style={{ color: colors.muted, lineHeight: 1.7 }}>
            {error || 'We could not find this book.'}
          </p>
          <Link to="/books" style={primaryLink}>
            Browse all books
          </Link>
        </section>
      </main>
    );
  }

  const category = Array.isArray(book.categories)
    ? book.categories[0]?.name
    : book.categories?.name;

  const price = finalPaise(
    book.original_price_paise,
    book.discount_percent,
    book.sale_price_paise
  );

  const hasDiscount = price < book.original_price_paise;
  const previewUrls = Array.isArray(book.preview_urls)
    ? book.preview_urls
    : [];

  const addToCart = () => {
    const currentIds = cartIds();
    setCart([...new Set([...currentIds, book.id])]);
    setMessage('Added to your cart');
  };

  const buyNow = () => {
    const currentIds = cartIds();
    setCart([...new Set([...currentIds, book.id])]);
    navigate('/cart');
  };

  const whatsappUrl = waLink(
    `Hi, I want to buy this book: ${book.title}. ${window.location.href}`
  );

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <nav aria-label="Breadcrumb" style={breadcrumbStyle}>
          <Link to="/" style={breadcrumbLink}>Home</Link>
          <span>/</span>
          <Link to="/books" style={breadcrumbLink}>Books</Link>
          {category && (
            <>
              <span>/</span>
              <span style={breadcrumbCurrent}>{category}</span>
            </>
          )}
        </nav>

        <section className="book-detail-layout">
          <div className="book-detail-cover-column">
            <div className="book-detail-cover-frame">
              {book.cover_url && !coverFailed ? (
                <img
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  onError={() => setCoverFailed(true)}
                  style={coverImageStyle}
                />
              ) : (
                <div style={coverFallback}>
                  <span style={{ fontSize: 42 }}>📖</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 22 }}>
                    {book.title}
                  </span>
                  {book.author && (
                    <span style={{ fontSize: 13, opacity: 0.8 }}>
                      {book.author}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p style={coverCaption}>
              <span>▣</span> Digital edition
              <span style={{ color: colors.border }}>·</span>
              Instant access after purchase
            </p>
          </div>

          <div className="book-detail-info">
            <div style={eyebrowStyle}>
              <span style={eyebrowDot} />
              WEBLI LITERATE BOOKSTORE
            </div>

            {category && (
              <span style={categoryPill}>{category}</span>
            )}

            <h1 className="book-detail-title">{book.title}</h1>

            <p style={authorStyle}>
              Written by <strong>{book.author || 'Independent author'}</strong>
            </p>

            <div style={metadataStyle}>
              {book.language && (
                <div style={metadataItem}>
                  <span style={metadataIcon}>文</span>
                  <div>
                    <small style={metadataLabel}>Language</small>
                    <strong>{book.language}</strong>
                  </div>
                </div>
              )}

              {book.page_count && (
                <div style={metadataItem}>
                  <span style={metadataIcon}>▤</span>
                  <div>
                    <small style={metadataLabel}>Length</small>
                    <strong>{book.page_count} pages</strong>
                  </div>
                </div>
              )}

              <div style={metadataItem}>
                <span style={metadataIcon}>PDF</span>
                <div>
                  <small style={metadataLabel}>Format</small>
                  <strong>Digital book</strong>
                </div>
              </div>
            </div>

            <div style={pricePanel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={priceLabel}>YOUR PRICE</span>
                {hasDiscount && (
                  <span style={discountBadge}>
                    {book.discount_percent}% OFF
                  </span>
                )}
              </div>

              <div style={priceRow}>
                <strong style={priceValue}>{inr(price)}</strong>
                {hasDiscount && (
                  <s style={originalPrice}>
                    {inr(book.original_price_paise)}
                  </s>
                )}
              </div>

              {hasDiscount && (
                <p style={savingText}>
                  You save {inr(book.original_price_paise - price)}
                </p>
              )}
            </div>

            {message && (
              <p role="status" style={successMessage}>
                ✓ {message}
              </p>
            )}

            <div className="book-detail-actions">
              {book.purchasable ? (
                <>
                  <button onClick={buyNow} style={buyButton}>
                    Buy now <span aria-hidden="true">→</span>
                  </button>
                  <button onClick={addToCart} style={cartButton}>
                    <span aria-hidden="true">＋</span> Add to cart
                  </button>
                </>
              ) : (
                <p style={unavailableStyle}>
                  This book is not currently available for purchase.
                </p>
              )}
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={whatsappStyle}
            >
              <span aria-hidden="true">↗</span>
              Ask about this book on WhatsApp
            </a>

            <div style={trustStrip}>
              <div style={trustItem}>
                <span style={trustIcon}>✓</span>
                <span>Secure checkout</span>
              </div>
              <div style={trustItem}>
                <span style={trustIcon}>↓</span>
                <span>Digital access</span>
              </div>
              <div style={trustItem}>
                <span style={trustIcon}>♡</span>
                <span>Read anywhere</span>
              </div>
            </div>
          </div>
        </section>

        {book.description && (
          <section style={descriptionSection}>
            <div style={sectionEyebrow}>ABOUT THIS BOOK</div>
            <h2 style={sectionTitle}>A little more to discover.</h2>
            <p style={descriptionText}>{book.description}</p>
          </section>
        )}

        {previewUrls.length > 0 && (
          <section style={previewSection}>
            <div style={sectionHeader}>
              <div>
                <div style={sectionEyebrow}>TAKE A LOOK INSIDE</div>
                <h2 style={sectionTitle}>Sample pages</h2>
              </div>
              <span style={previewCount}>
                {previewUrls.length} {previewUrls.length === 1 ? 'sample' : 'samples'}
              </span>
            </div>

            <div className="book-detail-previews">
              {previewUrls.map((url, index) => {
                const isPdf = /\.pdf($|[?#])/i.test(url);

                return isPdf ? (
                  <div key={`${url}-${index}`} style={pdfPreviewCard}>
                    <div style={pdfPreviewHeading}>
                      <span>PDF SAMPLE</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={openPdfLink}
                      >
                        Open separately ↗
                      </a>
                    </div>
                    <iframe
                      src={url}
                      title={`PDF sample ${index + 1}`}
                      loading="lazy"
                      style={pdfFrame}
                    />
                  </div>
                ) : (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setZoom(url)}
                    aria-label={`Enlarge sample page ${index + 1}`}
                    style={sampleImageButton}
                  >
                    <img
                      src={url}
                      alt={`Sample page ${index + 1}`}
                      loading="lazy"
                      style={sampleImage}
                    />
                    <span style={zoomHint}>View larger ↗</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div style={bottomNavigation}>
          <Link to="/books" style={backLink}>← Back to all books</Link>
        </div>
      </div>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged sample page"
          onClick={() => setZoom('')}
          style={lightbox}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setZoom('')}
            style={closeLightbox}
          >
            ×
          </button>
          <img
            src={zoom}
            alt="Enlarged sample page"
            onClick={event => event.stopPropagation()}
            style={lightboxImage}
          />
          <p style={lightboxHint}>Click outside the image or press Escape to close</p>
        </div>
      )}

      <style>{`
        .book-detail-layout {
          display: grid;
          grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
          gap: clamp(28px, 6vw, 76px);
          align-items: start;
        }
        .book-detail-cover-column { min-width: 0; }
        .book-detail-cover-frame {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          background: #F0EDE3;
          border: 1px solid ${colors.border};
          border-radius: 18px;
          min-height: 380px;
        }
        .book-detail-info { min-width: 0; }
        .book-detail-title {
          margin: 18px 0 10px;
          color: ${colors.ink};
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(32px, 4.1vw, 50px);
          line-height: 1.12;
          letter-spacing: -1.2px;
          overflow-wrap: anywhere;
        }
        .book-detail-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 22px;
        }
        .book-detail-previews {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 700px) {
          .book-detail-layout { grid-template-columns: minmax(0, 1fr); gap: 30px; }
          .book-detail-cover-frame { min-height: 260px; padding: 20px; }
          .book-detail-cover-frame img { max-height: 440px; }
          .book-detail-title { font-size: 36px; }
          .book-detail-actions { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '70vh',
  background: colors.background,
  color: colors.ink,
  padding: '22px 18px 64px',
};

const contentStyle: React.CSSProperties = {
  maxWidth: 1160,
  margin: '0 auto',
};

const breadcrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 30,
  fontSize: 13,
  color: colors.muted,
};

const breadcrumbLink: React.CSSProperties = {
  color: colors.green,
  textDecoration: 'none',
};

const breadcrumbCurrent: React.CSSProperties = {
  overflowWrap: 'anywhere',
};

const loadingStyle: React.CSSProperties = {
  minHeight: 360,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
};

const errorCard: React.CSSProperties = {
  maxWidth: 500,
  margin: '60px auto',
  padding: 32,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  textAlign: 'center',
};

const primaryLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 46,
  marginTop: 12,
  padding: '0 20px',
  background: colors.green,
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 8,
  fontWeight: 700,
};

const coverImageStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: 350,
  maxHeight: 560,
  aspectRatio: '2 / 3',
  objectFit: 'contain',
  borderRadius: 6,
  boxShadow: '0 18px 40px #202B2424',
};

const coverFallback: React.CSSProperties = {
  width: '100%',
  maxWidth: 350,
  minHeight: 420,
  aspectRatio: '2 / 3',
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 16,
  textAlign: 'center',
  color: colors.green,
  background: '#E8EDE5',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  overflowWrap: 'anywhere',
};

const coverCaption: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 9,
  marginTop: 14,
  color: colors.muted,
  fontSize: 12,
};

const eyebrowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: colors.green,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.7,
};

const eyebrowDot: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: colors.gold,
};

const categoryPill: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 18,
  padding: '6px 11px',
  borderRadius: 30,
  background: '#E8EDE5',
  color: colors.green,
  fontSize: 12,
  fontWeight: 700,
};

const authorStyle: React.CSSProperties = {
  color: colors.muted,
  fontSize: 15,
  lineHeight: 1.7,
};

const metadataStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 20,
  padding: '22px 0',
  marginTop: 12,
  borderTop: `1px solid ${colors.border}`,
  borderBottom: `1px solid ${colors.border}`,
};

const metadataItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const metadataIcon: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 36,
  height: 36,
  borderRadius: 9,
  background: '#E8EDE5',
  color: colors.green,
  fontSize: 12,
  fontWeight: 800,
};

const metadataLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  color: colors.muted,
  fontSize: 11,
};

const pricePanel: React.CSSProperties = {
  marginTop: 24,
  padding: 20,
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
};

const priceLabel: React.CSSProperties = {
  color: colors.muted,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.4,
};

const discountBadge: React.CSSProperties = {
  padding: '5px 9px',
  borderRadius: 5,
  background: '#F8E9D9',
  color: '#8A4D22',
  fontSize: 11,
  fontWeight: 800,
};

const priceRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 8,
};

const priceValue: React.CSSProperties = {
  fontSize: 32,
  letterSpacing: -0.8,
  color: colors.green,
};

const originalPrice: React.CSSProperties = {
  color: colors.muted,
  fontSize: 15,
};

const savingText: React.CSSProperties = {
  margin: '5px 0 0',
  color: colors.green,
  fontSize: 12,
};

const successMessage: React.CSSProperties = {
  marginTop: 14,
  padding: 11,
  borderRadius: 8,
  background: '#E8EDE5',
  color: colors.green,
  fontSize: 13,
  fontWeight: 700,
};

const buyButton: React.CSSProperties = {
  ...buttonStyle,
  background: colors.green,
  color: '#fff',
  border: `1px solid ${colors.green}`,
};

const cartButton: React.CSSProperties = {
  ...buttonStyle,
  background: colors.surface,
  color: colors.green,
  border: `1px solid ${colors.green}`,
};

const unavailableStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  padding: 14,
  borderRadius: 8,
  background: '#F8E9D9',
  color: '#8A4D22',
  lineHeight: 1.6,
};

const whatsappStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 17,
  color: colors.green,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
};

const trustStrip: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px 18px',
  marginTop: 26,
  paddingTop: 18,
  borderTop: `1px solid ${colors.border}`,
};

const trustItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  color: colors.muted,
  fontSize: 11,
};

const trustIcon: React.CSSProperties = {
  color: colors.green,
  fontWeight: 800,
};

const descriptionSection: React.CSSProperties = {
  marginTop: 68,
  padding: '30px clamp(20px, 5vw, 48px)',
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
};

const sectionEyebrow: React.CSSProperties = {
  color: colors.gold,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.7,
};

const sectionTitle: React.CSSProperties = {
  margin: '10px 0 18px',
  color: colors.ink,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 'clamp(25px, 3vw, 34px)',
  fontWeight: 500,
  letterSpacing: -0.5,
};

const descriptionText: React.CSSProperties = {
  maxWidth: 850,
  margin: 0,
  color: '#515B53',
  fontSize: 15,
  lineHeight: 1.95,
  whiteSpace: 'pre-wrap',
};

const previewSection: React.CSSProperties = {
  marginTop: 58,
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'end',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 12,
  marginBottom: 22,
};

const previewCount: React.CSSProperties = {
  padding: '7px 11px',
  background: '#E8EDE5',
  color: colors.green,
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 700,
};

const pdfPreviewCard: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
};

const pdfPreviewHeading: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 10,
  padding: 12,
  color: colors.muted,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.7,
};

const openPdfLink: React.CSSProperties = {
  color: colors.green,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0,
  textDecoration: 'none',
};

const pdfFrame: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 420,
  border: 0,
  background: '#F0EDE3',
};

const sampleImageButton: React.CSSProperties = {
  position: 'relative',
  display: 'block',
  width: '100%',
  padding: 10,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  background: colors.surface,
  cursor: 'zoom-in',
  textAlign: 'left',
};

const sampleImage: React.CSSProperties = {
  display: 'block',
  width: '100%',
  maxHeight: 420,
  objectFit: 'contain',
  background: '#F0EDE3',
  borderRadius: 5,
};

const zoomHint: React.CSSProperties = {
  display: 'block',
  padding: '10px 3px 2px',
  color: colors.green,
  fontSize: 12,
  fontWeight: 700,
};

const bottomNavigation: React.CSSProperties = {
  marginTop: 50,
  paddingTop: 20,
  borderTop: `1px solid ${colors.border}`,
};

const backLink: React.CSSProperties = {
  color: colors.green,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
};

const lightbox: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 24,
  background: '#101711F2',
  cursor: 'zoom-out',
};

const closeLightbox: React.CSSProperties = {
  position: 'fixed',
  top: 18,
  right: 22,
  width: 44,
  height: 44,
  border: '1px solid #FFFFFF55',
  borderRadius: '50%',
  background: '#FFFFFF18',
  color: '#fff',
  fontSize: 30,
  cursor: 'pointer',
};

const lightboxImage: React.CSSProperties = {
  maxWidth: '94vw',
  maxHeight: '86vh',
  objectFit: 'contain',
  borderRadius: 5,
  cursor: 'default',
};

const lightboxHint: React.CSSProperties = {
  color: '#FFFFFFB3',
  fontSize: 12,
  textAlign: 'center',
};

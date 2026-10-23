
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, api } from '../lib/supabase';
import { inr } from '../lib/brand';

type OrderItem = {
  book_id: string;
  books: { title: string } | null;
};

type Order = {
  reference: string;
  total_paise: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const paymentMessages: Record<string, string> = {
  pending: 'We are waiting for confirmation from your payment provider.',
  paid: 'Your payment has been confirmed. Your books are ready!',
  failed: 'The payment was unsuccessful. You can return to your cart and try again.',
  refunded: 'This order has been refunded. Access to these books has been revoked.',
};

const statusLabels: Record<string, string> = {
  pending: 'Payment pending',
  paid: 'Payment successful',
  failed: 'Payment failed',
  refunded: 'Refunded',
};

export default function OrderSuccess() {
  const { reference } = useParams<{ reference: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);
  const [loadingBook, setLoadingBook] = useState<string | null>(null);
  const [bookError, setBookError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function loadOrder() {
      if (!reference) {
        setError('An order reference is missing.');
        return;
      }

      const { data, error: queryError } = await supabase
        .from('orders')
        .select(
          'reference,total_paise,status,paid_at,created_at,order_items(book_id,books(title))'
        )
        .eq('reference', reference)
        .maybeSingle();

      if (cancelled) return;

      if (queryError) {
        setError('We could not retrieve your order. Please try again later.');
        return;
      }

      if (!data) {
        setError('We could not find an order with this reference.');
        return;
      }

      setOrder(data as unknown as Order);

      if (data.status === 'pending' && tries < 20) {
        timer = setTimeout(() => {
          if (!cancelled) setTries((current) => current + 1);
        }, 3000);
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, tries]);

  async function openBook(bookId: string) {
    if (loadingBook) return;

    setLoadingBook(bookId);
    setBookError('');

    try {
      const result = await api('book-url', { bookId });

      if (!result?.url) {
        throw new Error('A book download link is not available yet.');
      }

      const url = new URL(result.url);

      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('The returned book link is invalid.');
      }

      window.open(url.href, '_blank', 'noopener,noreferrer');
    } catch {
      setBookError(
        'We could not open this book. Please visit My Purchases or try again.'
      );
    } finally {
      setLoadingBook(null);
    }
  }

  const status = order?.status ?? 'pending';
  const paid = status === 'paid';
  const pending = status === 'pending';
  const failed = status === 'failed';
  const refunded = status === 'refunded';

  return (
    <main className="os-page">
      <style>{`
        .os-page {
          --os-ink: #20251f;
          --os-green: #244b38;
          --os-muted: #73786e;
          --os-paper: #fbfaf6;
          --os-line: #e8e6dd;
          min-height: 80vh;
          padding: 38px 16px 70px;
          background: var(--os-paper);
          color: var(--os-ink);
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }

        .os-page * { box-sizing: border-box; }

        .os-container { max-width: 720px; margin: 0 auto; }

        .os-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 34px;
          text-decoration: none;
          color: inherit;
        }

        .os-logo {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 6px;
          background: var(--os-green);
          color: white;
          font: 700 23px Georgia, serif;
        }

        .os-brand-name {
          font: 700 23px Georgia, serif;
          letter-spacing: -.7px;
        }

        .os-brand-caption {
          display: block;
          margin-top: 3px;
          color: var(--os-muted);
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .os-card {
          overflow: hidden;
          background: white;
          border: 1px solid var(--os-line);
          border-radius: 9px;
          box-shadow: 0 12px 36px rgba(32,37,31,.04);
        }

        .os-hero {
          padding: 35px 28px 29px;
          text-align: center;
          border-bottom: 1px solid var(--os-line);
        }

        .os-icon {
          display: grid;
          place-items: center;
          width: 66px;
          height: 66px;
          margin: 0 auto 19px;
          border-radius: 50%;
          font-size: 28px;
          font-weight: 700;
        }

        .os-icon.paid { background: #e5f1e5; color: #28623e; }
        .os-icon.pending { background: #f8efda; color: #8a6521; }
        .os-icon.failed { background: #f9e8e3; color: #a04432; }
        .os-icon.refunded { background: #ecece8; color: #65685e; }

        .os-eyebrow {
          color: #59745c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .os-hero h1 {
          margin: 12px 0;
          font: 500 clamp(29px, 5vw, 40px)/1.2 Georgia, serif;
          letter-spacing: -1px;
          overflow-wrap: anywhere;
        }

        .os-description {
          max-width: 440px;
          margin: 0 auto;
          color: var(--os-muted);
          font-size: 13px;
          line-height: 1.8;
        }

        .os-body { padding: 25px 28px; }

        .os-reference {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--os-line);
        }

        .os-label {
          display: block;
          margin-bottom: 7px;
          color: var(--os-muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .os-ref-value {
          font-size: 13px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .os-badge {
          display: inline-block;
          padding: 8px 11px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .os-badge.paid { background: #e5f1e5; color: #28623e; }
        .os-badge.pending { background: #f8efda; color: #8a6521; }
        .os-badge.failed { background: #f9e8e3; color: #a04432; }
        .os-badge.refunded { background: #ecece8; color: #65685e; }

        .os-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 21px 0;
          border-bottom: 1px solid var(--os-line);
        }

        .os-total-label { color: var(--os-muted); font-size: 12px; }
        .os-total {
          font: 500 27px Georgia, serif;
          color: var(--os-green);
        }

        .os-date {
          margin-top: 7px;
          color: var(--os-muted);
          font-size: 11px;
          line-height: 1.7;
        }

        .os-section-title {
          margin: 24px 0 13px;
          font: 500 22px Georgia, serif;
        }

        .os-book {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 16px 0;
          border-bottom: 1px solid #efeee8;
        }

        .os-book:last-child { border-bottom: 0; }

        .os-book-info { min-width: 0; }

        .os-book-title {
          display: block;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .os-book-subtitle {
          display: block;
          margin-top: 5px;
          color: var(--os-muted);
          font-size: 11px;
        }

        .os-button, .os-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 14px;
          border: 1px solid var(--os-green);
          border-radius: 5px;
          background: var(--os-green);
          color: white;
          text-decoration: none;
          font: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          flex-shrink: 0;
        }

        .os-button:hover:not(:disabled) { background: #345e45; }
        .os-button:disabled { opacity: .6; cursor: wait; }

        .os-link.secondary {
          background: white;
          color: var(--os-green);
        }

        .os-link.secondary:hover { background: #eef1e9; }

        .os-alert {
          margin-top: 20px;
          padding: 14px;
          border-radius: 5px;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .os-alert.warning {
          background: #fff8e8;
          border: 1px solid #eee0b9;
          color: #775c27;
        }

        .os-alert.error {
          background: #fff3f0;
          border: 1px solid #f0d6ce;
          color: #913f32;
        }

        .os-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }

        .os-footer {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid var(--os-line);
          color: var(--os-muted);
          font-size: 11px;
        }

        .os-footer a { color: var(--os-green); text-decoration: none; }

        .os-error-card {
          padding: 30px;
          background: white;
          border: 1px solid var(--os-line);
          border-radius: 8px;
          text-align: center;
        }

        .os-error-card h1 {
          font: 500 30px Georgia, serif;
        }

        .os-error-card p {
          color: var(--os-muted);
          font-size: 13px;
          line-height: 1.8;
        }

        @media(max-width: 520px) {
          .os-page { padding: 24px 12px 42px; }
          .os-hero { padding: 28px 18px 24px; }
          .os-body { padding: 21px 17px; }
          .os-book { align-items: flex-start; flex-direction: column; }
          .os-book .os-button { width: 100%; }
          .os-actions { flex-direction: column; }
          .os-actions > * { width: 100%; }
          .os-footer { flex-direction: column; }
        }

        @media(prefers-reduced-motion: reduce) {
          .os-page * { scroll-behavior: auto !important; }
        }
      `}</style>

      <div className="os-container">
        <Link to="/" className="os-brand">
          <span className="os-logo">W.</span>
          <span>
            <span className="os-brand-name">Webli Literate</span>
            <span className="os-brand-caption">Your digital bookshelf</span>
          </span>
        </Link>

        {error ? (
          <section className="os-error-card" role="alert">
            <div className="os-icon failed">!</div>
            <h1>Order unavailable</h1>
            <p>{error}</p>
            <div className="os-actions" style={{ justifyContent: 'center' }}>
              <Link to="/purchases" className="os-link">
                My Purchases ↗
              </Link>
              <Link to="/books" className="os-link secondary">
                Browse books
              </Link>
            </div>
          </section>
        ) : !order ? (
          <section className="os-error-card" role="status">
            <div className="os-icon pending">…</div>
            <h1>Retrieving your order</h1>
            <p>Please wait while we load your order details.</p>
          </section>
        ) : (
          <section className="os-card">
            <header className="os-hero">
              <div className={`os-icon ${paid ? 'paid' : pending ? 'pending' : failed ? 'failed' : 'refunded'}`}>
                {paid ? '✓' : pending ? '…' : failed ? '!' : '↺'}
              </div>

              <span className="os-eyebrow">
                {paid ? 'ORDER CONFIRMED' : 'ORDER UPDATE'}
              </span>

              <h1>
                {paid
                  ? 'Your next chapter begins.'
                  : pending
                    ? 'Confirming your payment.'
                    : failed
                      ? 'Payment not completed.'
                      : 'Order refunded.'}
              </h1>

              <p className="os-description" role="status">
                {paymentMessages[status] ??
                  'Your order status is being reviewed. Please contact support if you need assistance.'}
              </p>
            </header>

            <div className="os-body">
              <div className="os-reference">
                <div>
                  <span className="os-label">Order reference</span>
                  <span className="os-ref-value">{order.reference}</span>
                </div>

                <span className={`os-badge ${paid ? 'paid' : pending ? 'pending' : failed ? 'failed' : 'refunded'}`}>
                  {statusLabels[status] ?? status}
                </span>
              </div>

              <div className="os-summary">
                <div>
                  <span className="os-total-label">Order total</span>
                  <div className="os-date">
                    {new Date(order.paid_at || order.created_at).toLocaleString()}
                  </div>
                </div>

                <strong className="os-total">{inr(order.total_paise)}</strong>
              </div>

              {pending && tries >= 20 && (
                <div className="os-alert warning" role="status">
                  Payment is still pending after several checks. Please check
                  My Purchases in a few minutes before attempting another
                  payment.
                  <div style={{ marginTop: 10 }}>
                    <button
                      className="os-link secondary"
                      onClick={() => setTries(0)}
                    >
                      Check status again ↻
                    </button>
                  </div>
                </div>
              )}

              <h2 className="os-section-title">
                {paid ? 'Your books' : 'Order items'}
              </h2>

              {order.order_items?.length ? (
                order.order_items.map((item, index) => (
                  <div className="os-book" key={`${item.book_id}-${index}`}>
                    <div className="os-book-info">
                      <span className="os-book-title">
                        {item.books?.title || 'Digital book'}
                      </span>
                      <span className="os-book-subtitle">
                        {paid
                          ? 'Included in your purchase'
                          : 'Digital book order item'}
                      </span>
                    </div>

                    {paid && (
                      <button
                        className="os-button"
                        disabled={loadingBook !== null}
                        onClick={() => openBook(item.book_id)}
                      >
                        {loadingBook === item.book_id
                          ? 'Opening...'
                          : 'Read / Download ↗'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="os-description" style={{ textAlign: 'left' }}>
                  No order items are available to display.
                </p>
              )}

              {bookError && (
                <div className="os-alert error" role="alert">
                  {bookError}
                </div>
              )}

              {failed && (
                <div className="os-alert warning">
                  If you believe money was deducted, check your payment
                  provider or bank statement before trying again.
                </div>
              )}

              {refunded && (
                <div className="os-alert warning">
                  Refund processing times may depend on your payment provider.
                  Contact support if you need help tracking your refund.
                </div>
              )}

              <div className="os-actions">
                {failed && (
                  <Link to="/cart" className="os-link">
                    Return to cart ↗
                  </Link>
                )}

                <Link to="/purchases" className="os-link">
                  My Purchases ↗
                </Link>

                <Link to="/books" className="os-link secondary">
                  Continue browsing
                </Link>
              </div>
            </div>
          </section>
        )}

        <footer className="os-footer">
          <span>© {new Date().getFullYear()} Webli Literate</span>
          <Link to="/contact">Need help? Contact support ↗</Link>
        </footer>
      </div>
    </main>
  );
}

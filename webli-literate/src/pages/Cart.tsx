
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, api } from '../lib/supabase';
import { useCart, setCart } from '../lib/cart';
import { inr, finalPaise } from '../lib/brand';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

type Book = {
  id: string;
  title: string;
  original_price_paise: number;
  discount_percent: number | null;
  sale_price_paise: number | null;
};

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    const script = existing ?? document.createElement('script');

    const onLoad = () => {
      if (window.Razorpay) resolve();
      else reject(new Error('Payment checkout could not be initialized.'));
    };

    const onError = () => {
      razorpayScriptPromise = null;
      reject(new Error('Unable to load payment checkout. Please try again.'));
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (!existing) {
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      resolve();
    }
  });

  return razorpayScriptPromise;
}

export default function Cart() {
  const ids = useCart();
  const cartKey = ids.join('|');
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('info');
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      if (!ids.length) {
        setBooks([]);
        setLoadingBooks(false);
        return;
      }

      setLoadingBooks(true);

      const { data, error } = await supabase
        .from('books')
        .select(
          'id,title,original_price_paise,discount_percent,sale_price_paise'
        )
        .in('id', ids);

      if (!active) return;

      if (error) {
        console.error('Cart books could not be loaded:', error.message);
        setMessage('We could not load your cart. Please refresh and try again.');
        setMessageType('error');
      } else {
        setBooks((data ?? []) as Book[]);
        setMessage('');
      }

      setLoadingBooks(false);
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, [cartKey]);

  const total = useMemo(
    () =>
      books.reduce(
        (sum, book) =>
          sum +
          finalPaise(
            book.original_price_paise,
            book.discount_percent,
            book.sale_price_paise
          ),
        0
      ),
    [books]
  );

  const originalTotal = useMemo(
    () =>
      books.reduce((sum, book) => sum + book.original_price_paise, 0),
    [books]
  );

  const savings = Math.max(0, originalTotal - total);
  const cartIsReady =
    !loadingBooks &&
    books.length === ids.length &&
    ids.length > 0;

  const removeBook = useCallback(
    (id: string) => {
      if (busy) return;

      setRemovingId(id);
      setCart(ids.filter((bookId) => bookId !== id));
      setRemovingId(null);
      setMessage('');
    },
    [busy, cartKey]
  );

  const pay = async () => {
    if (busy || !cartIsReady) return;

    setBusy(true);
    setMessage('');

    let checkoutOpened = false;

    try {
      await loadRazorpay();

      if (!window.Razorpay) {
        throw new Error('Payment checkout is unavailable. Please try again.');
      }

      // The server must calculate prices and validate book availability.
      const order = await api('create-order', { bookIds: ids });

      if (
        !order?.keyId ||
        !order?.razorpayOrderId ||
        !order?.reference ||
        !Number.isFinite(Number(order.amount)) ||
        Number(order.amount) <= 0
      ) {
        throw new Error('We could not prepare your order. Please try again.');
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.razorpayOrderId,
        name: 'Webli Literate',
        description: `Purchase of ${ids.length} ${
          ids.length === 1 ? 'book' : 'books'
        }`,
        theme: {
          color: '#24533d',
        },
        prefill: {},
        modal: {
          ondismiss: () => {
            setBusy(false);
            if (checkoutOpened) {
              setMessage('Payment was cancelled. You can safely try again.');
              setMessageType('info');
            }
          },
        },
        handler: () => {
          // OrderSuccess checks the server-side order status.
          // Do not mark an order as paid in the browser.
          setCart([]);
          navigate(`/order/${encodeURIComponent(order.reference)}`);
        },
      });

      checkout.on('payment.failed', () => {
        setBusy(false);
        setMessage('Payment failed. Please try again or use another payment method.');
        setMessageType('error');
      });

      checkoutOpened = true;
      checkout.open();
    } catch (error) {
      console.error('Checkout could not be started:', error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while starting payment. Please try again.'
      );
      setMessageType('error');
      setBusy(false);
    }
  };

  const formatDiscount = (book: Book) => {
    if (
      !book.discount_percent ||
      book.discount_percent <= 0 ||
      finalPaise(
        book.original_price_paise,
        book.discount_percent,
        book.sale_price_paise
      ) >= book.original_price_paise
    ) {
      return null;
    }

    return `${book.discount_percent}% OFF`;
  };

  return (
    <main className="wl-cart-page">
      <style>{`
        .wl-cart-page {
          --cart-green: #24533d;
          --cart-dark: #173c2c;
          --cart-cream: #faf8f1;
          --cart-line: #e7e5da;
          --cart-muted: #777d73;
          min-height: 75vh;
          padding: 35px 20px 70px;
          background: var(--cart-cream);
          color: #263329;
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }
        .wl-cart-page * { box-sizing: border-box; }
        .wl-cart-container { max-width: 1120px; margin: 0 auto; }
        .wl-cart-breadcrumb {
          display: flex; gap: 9px; align-items: center;
          color: var(--cart-muted); font-size: 12px; margin-bottom: 27px;
        }
        .wl-cart-breadcrumb a {
          color: var(--cart-green); text-decoration: none; font-weight: 700;
        }
        .wl-cart-heading {
          margin: 0 0 9px; font: 700 clamp(32px, 5vw, 45px)/1.12 Georgia, serif;
          letter-spacing: -1px; color: var(--cart-dark);
        }
        .wl-cart-subtitle {
          margin: 0; color: var(--cart-muted); font-size: 14px; line-height: 1.7;
        }
        .wl-cart-layout {
          display: grid; grid-template-columns: minmax(0, 1fr) 340px;
          align-items: start; gap: 25px; margin-top: 30px;
        }
        .wl-cart-items { display: grid; gap: 14px; min-width: 0; }
        .wl-cart-item {
          display: flex; align-items: center; gap: 17px;
          padding: 19px; border: 1px solid var(--cart-line);
          border-radius: 16px; background: white;
          box-shadow: 0 5px 18px #233b2710;
        }
        .wl-cart-cover {
          display: grid; place-items: center; flex-shrink: 0;
          width: 72px; height: 95px; border-radius: 8px;
          color: #f6e9cd; font-size: 30px;
          background: linear-gradient(145deg, #38684d, #173b2c);
          box-shadow: inset -5px 0 0 #ffffff12;
        }
        .wl-cart-info { flex: 1; min-width: 0; }
        .wl-cart-info h2 {
          margin: 0 0 7px; font: 700 19px/1.35 Georgia, serif;
          color: #263b2d; overflow-wrap: anywhere;
        }
        .wl-cart-price {
          display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px;
          color: var(--cart-green); font-weight: 800; font-size: 16px;
        }
        .wl-cart-original {
          color: #96998f; font-size: 12px; font-weight: 500;
          text-decoration: line-through;
        }
        .wl-cart-discount {
          display: inline-flex; margin-top: 8px; padding: 5px 8px;
          border-radius: 6px; background: #edf4e9; color: #356b42;
          font-size: 10px; font-weight: 850; letter-spacing: .3px;
        }
        .wl-cart-remove {
          margin-top: 12px; padding: 0; border: 0; background: transparent;
          color: #9a5145; font: inherit; font-size: 12px; font-weight: 700;
          cursor: pointer;
        }
        .wl-cart-remove:hover { text-decoration: underline; }
        .wl-cart-remove:disabled { opacity: .5; cursor: wait; }
        .wl-cart-summary {
          position: sticky; top: 95px; padding: 24px;
          border: 1px solid var(--cart-line); border-radius: 17px;
          background: white; box-shadow: 0 7px 24px #233b2710;
        }
        .wl-cart-summary h2 {
          margin: 0 0 21px; font: 700 24px Georgia, serif;
          color: var(--cart-dark);
        }
        .wl-cart-summary-line {
          display: flex; justify-content: space-between; gap: 15px;
          margin: 15px 0; color: #6d756b; font-size: 13px;
        }
        .wl-cart-summary-line strong { color: #29372b; font-weight: 700; text-align: right; }
        .wl-cart-saving { color: #367747 !important; }
        .wl-cart-total {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 12px; padding-top: 18px; margin-top: 18px;
          border-top: 1px solid var(--cart-line);
        }
        .wl-cart-total span { color: var(--cart-dark); font-weight: 750; }
        .wl-cart-total strong {
          color: var(--cart-green); font: 700 27px Georgia, serif;
          text-align: right;
        }
        .wl-cart-pay {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          width: 100%; min-height: 49px; margin-top: 22px; padding: 13px 17px;
          border: 0; border-radius: 10px; background: var(--cart-green);
          color: white; font: inherit; font-size: 14px; font-weight: 800;
          cursor: pointer; transition: background .2s ease, transform .2s ease;
        }
        .wl-cart-pay:hover:not(:disabled) {
          background: var(--cart-dark); transform: translateY(-1px);
        }
        .wl-cart-pay:disabled { opacity: .55; cursor: not-allowed; }
        .wl-cart-security {
          display: flex; align-items: flex-start; gap: 9px; margin-top: 17px;
          color: var(--cart-muted); font-size: 11px; line-height: 1.6;
        }
        .wl-cart-security span { color: var(--cart-green); font-size: 15px; }
        .wl-cart-alert {
          margin-top: 20px; padding: 13px 15px; border-radius: 10px;
          font-size: 13px; line-height: 1.65;
        }
        .wl-cart-alert.error { background: #fff0ed; border: 1px solid #edc8c1; color: #96382e; }
        .wl-cart-alert.info { background: #edf3ec; border: 1px solid #d7e4d4; color: #315c3c; }
        .wl-cart-empty {
          margin-top: 30px; padding: 55px 22px; text-align: center;
          border: 1px solid var(--cart-line); border-radius: 18px; background: white;
        }
        .wl-cart-empty-icon {
          display: grid; place-items: center; width: 74px; height: 74px;
          margin: 0 auto 18px; border-radius: 50%; background: #edf3ec;
          color: var(--cart-green); font-size: 32px;
        }
        .wl-cart-empty h2 { margin: 0 0 10px; font: 700 26px Georgia, serif; color: var(--cart-dark); }
        .wl-cart-empty p { max-width: 390px; margin: 0 auto 23px; color: var(--cart-muted); font-size: 14px; line-height: 1.7; }
        .wl-cart-browse {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 45px; padding: 12px 18px; border-radius: 10px;
          background: var(--cart-green); color: white; font-size: 13px;
          font-weight: 750; text-decoration: none;
        }
        .wl-cart-skeleton {
          height: 136px; border-radius: 15px; border: 1px solid var(--cart-line);
          background: linear-gradient(100deg, #fff 30%, #f0eee5 50%, #fff 70%);
          background-size: 200% 100%; animation: cart-shimmer 1.4s infinite;
        }
        @keyframes cart-shimmer { to { background-position-x: -200%; } }
        .wl-cart-continue {
          display: inline-flex; margin-top: 20px; color: var(--cart-green);
          font-size: 12px; font-weight: 750; text-decoration: none;
        }
        .wl-cart-continue:hover { text-decoration: underline; }
        @media (max-width: 850px) {
          .wl-cart-layout { grid-template-columns: minmax(0, 1fr) 290px; gap: 15px; }
          .wl-cart-summary { padding: 19px; }
        }
        @media (max-width: 680px) {
          .wl-cart-page { padding: 25px 14px 45px; }
          .wl-cart-layout { grid-template-columns: 1fr; }
          .wl-cart-summary { position: static; }
          .wl-cart-item { gap: 12px; padding: 14px; }
          .wl-cart-cover { width: 58px; height: 78px; font-size: 25px; }
          .wl-cart-info h2 { font-size: 16px; }
          .wl-cart-price { font-size: 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wl-cart-skeleton { animation: none; }
          .wl-cart-pay { transition: none; }
        }
      `}</style>

      <div className="wl-cart-container">
        <div className="wl-cart-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/books">Books</Link>
          <span>/</span>
          <span>Shopping cart</span>
        </div>

        <h1 className="wl-cart-heading">Your Shopping Cart</h1>
        <p className="wl-cart-subtitle">
          Your next great read is just a few steps away.
        </p>

        {message && (
          <div
            className={`wl-cart-alert ${messageType}`}
            role={messageType === 'error' ? 'alert' : 'status'}
          >
            {message}
          </div>
        )}

        {!ids.length ? (
          <section className="wl-cart-empty">
            <div className="wl-cart-empty-icon" aria-hidden="true">▤</div>
            <h2>Your cart is waiting for a good book</h2>
            <p>
              Explore our collection and add your next favourite read.
              Your selected books will appear here.
            </p>
            <Link to="/books" className="wl-cart-browse">
              Explore Books →
            </Link>
          </section>
        ) : (
          <div className="wl-cart-layout">
            <section aria-label="Books in your cart">
              {loadingBooks ? (
                <div className="wl-cart-items" aria-busy="true">
                  <div className="wl-cart-skeleton" />
                  <div className="wl-cart-skeleton" />
                </div>
              ) : books.length === 0 ? (
                <div className="wl-cart-empty">
                  <h2>We couldn't load your books</h2>
                  <p>Please refresh the page and try again.</p>
                  <button
                    className="wl-cart-browse"
                    onClick={() => window.location.reload()}
                  >
                    Refresh cart
                  </button>
                </div>
              ) : (
                <>
                  <div className="wl-cart-items">
                    {books.map((book) => {
                      const price = finalPaise(
                        book.original_price_paise,
                        book.discount_percent,
                        book.sale_price_paise
                      );
                      const discount = formatDiscount(book);

                      return (
                        <article className="wl-cart-item" key={book.id}>
                          <div className="wl-cart-cover" aria-hidden="true">
                            ▤
                          </div>

                          <div className="wl-cart-info">
                            <h2>{book.title}</h2>
                            <div className="wl-cart-price">
                              <span>{inr(price)}</span>
                              {price < book.original_price_paise && (
                                <span className="wl-cart-original">
                                  {inr(book.original_price_paise)}
                                </span>
                              )}
                            </div>

                            {discount && (
                              <div className="wl-cart-discount">
                                {discount}
                              </div>
                            )}

                            <div>
                              <button
                                type="button"
                                className="wl-cart-remove"
                                disabled={busy || removingId === book.id}
                                onClick={() => removeBook(book.id)}
                              >
                                {removingId === book.id
                                  ? 'Removing…'
                                  : 'Remove from cart'}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <Link to="/books" className="wl-cart-continue">
                    ← Continue browsing
                  </Link>
                </>
              )}
            </section>

            <aside className="wl-cart-summary" aria-label="Order summary">
              <h2>Order Summary</h2>

              <div className="wl-cart-summary-line">
                <span>Books</span>
                <strong>{ids.length}</strong>
              </div>

              <div className="wl-cart-summary-line">
                <span>Original price</span>
                <strong>{inr(originalTotal)}</strong>
              </div>

              {savings > 0 && (
                <div className="wl-cart-summary-line">
                  <span>Discount savings</span>
                  <strong className="wl-cart-saving">−{inr(savings)}</strong>
                </div>
              )}

              <div className="wl-cart-summary-line">
                <span>Delivery</span>
                <strong>Instant digital access</strong>
              </div>

              <div className="wl-cart-total">
                <span>Total</span>
                <strong>{inr(total)}</strong>
              </div>

              <button
                type="button"
                className="wl-cart-pay"
                onClick={pay}
                disabled={busy || !cartIsReady || !!err}
              >
                {busy ? 'Preparing secure checkout…' : 'Continue to Payment →'}
              </button>

              <div className="wl-cart-security">
                <span aria-hidden="true">♢</span>
                <span>
                  Secure payment powered by Razorpay. Your digital books
                  become available after your payment is confirmed.
                </span>
              </div>

              <div className="wl-cart-security">
                <span aria-hidden="true">✓</span>
                <span>
                  Digital access is subject to your purchase and the
                  applicable store policies.
                </span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

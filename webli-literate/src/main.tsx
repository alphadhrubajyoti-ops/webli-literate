
import './index.css';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  NavLink,
  useLocation,
} from 'react-router-dom';

import AuthGuard, { useSession } from './components/AuthGuard';
import BrandLogo from './components/BrandLogo';

import Login from './pages/Login';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Purchases from './pages/Purchases';
import OrderSuccess from './pages/OrderSuccess';
import { Policy, Contact } from './pages/Info';

import AdminLayout, { AdminGuard } from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import { BookList, BookForm } from './pages/admin/AdminBooks';
import AdminOrders from './pages/admin/AdminOrders';
import { Categories, Settings } from './pages/admin/AdminMisc';

import { supabase } from './lib/supabase';
import { useCart } from './lib/cart';

function Layout({ children }: { children: React.ReactNode }) {
  const cartCount = useCart().length;
  const { session } = useSession();
  const location = useLocation();

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      setAdminChecked(false);

      if (!session?.user?.id) {
        setIsAdmin(false);
        setAdminChecked(true);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin');

        if (!active) return;

        setIsAdmin(!error && data === true);
      } catch {
        if (active) setIsAdmin(false);
      } finally {
        if (active) setAdminChecked(true);
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out failed:', error.message);
      }
    } finally {
      setSigningOut(false);
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `wl-nav-link${isActive ? ' is-active' : ''}`;

  return (
    <div className="wl-app">
      <style>{`
        :root {
          --wl-green: #24533d;
          --wl-green-dark: #173c2c;
          --wl-green-soft: #edf3ec;
          --wl-cream: #faf8f1;
          --wl-paper: #ffffff;
          --wl-text: #263329;
          --wl-muted: #777d73;
          --wl-border: #e7e6dc;
          --wl-gold: #b88a50;
        }

        .wl-app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--wl-cream);
          color: var(--wl-text);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .wl-app * {
          box-sizing: border-box;
        }

        .wl-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, .96);
          border-bottom: 1px solid var(--wl-border);
          backdrop-filter: blur(14px);
        }

        .wl-header-inner {
          max-width: 1240px;
          min-height: 76px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .wl-logo {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          color: var(--wl-green);
          text-decoration: none;
        }

        .wl-nav {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 1;
        }

        .wl-nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 12px;
          border-radius: 9px;
          color: #5b655c;
          font-size: 13px;
          font-weight: 650;
          text-decoration: none;
          white-space: nowrap;
          transition: background .18s ease, color .18s ease;
        }

        .wl-nav-link:hover {
          color: var(--wl-green);
          background: #f3f5ef;
        }

        .wl-nav-link.is-active {
          color: var(--wl-green);
          background: var(--wl-green-soft);
        }

        .wl-cart-count {
          display: inline-grid;
          place-items: center;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 20px;
          background: var(--wl-green);
          color: white;
          font-size: 10px;
          font-weight: 800;
        }

        .wl-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }

        .wl-admin-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 13px;
          border-radius: 9px;
          border: 1px solid #d9e4d9;
          background: #f7faf5;
          color: var(--wl-green);
          font-size: 12px;
          font-weight: 750;
          text-decoration: none;
          white-space: nowrap;
        }

        .wl-admin-link:hover {
          background: var(--wl-green-soft);
        }

        .wl-signout {
          border: 0;
          border-radius: 9px;
          padding: 11px 15px;
          background: var(--wl-green);
          color: white;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
          transition: background .18s ease;
        }

        .wl-signout:hover {
          background: var(--wl-green-dark);
        }

        .wl-signout:disabled {
          opacity: .6;
          cursor: wait;
        }

        .wl-menu-toggle {
          display: none;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--wl-border);
          border-radius: 10px;
          background: white;
          color: var(--wl-green);
          font-size: 23px;
          cursor: pointer;
        }

        .wl-main {
          flex: 1;
          width: 100%;
        }

        .wl-footer {
          margin-top: 48px;
          border-top: 1px solid var(--wl-border);
          background: #fff;
        }

        .wl-footer-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 27px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 22px;
        }

        .wl-footer-brand {
          color: var(--wl-green);
          font-weight: 850;
          font-size: 14px;
          letter-spacing: -.3px;
        }

        .wl-footer-note {
          margin-top: 5px;
          color: var(--wl-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        .wl-footer-links {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 20px;
        }

        .wl-footer-links a {
          color: #677066;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }

        .wl-footer-links a:hover {
          color: var(--wl-green);
        }

        .wl-footer-copy {
          width: 100%;
          padding-top: 16px;
          border-top: 1px solid #f0efe8;
          color: #85897f;
          font-size: 11px;
        }

        @media (max-width: 1000px) {
          .wl-header-inner {
            gap: 15px;
            padding: 12px 18px;
          }

          .wl-nav-link {
            padding: 9px 8px;
            font-size: 12px;
          }

          .wl-admin-link {
            padding: 10px;
          }
        }

        @media (max-width: 760px) {
          .wl-header-inner {
            min-height: 68px;
            flex-wrap: wrap;
            gap: 12px;
            padding: 11px 16px;
          }

          .wl-logo {
            margin-right: auto;
          }

          .wl-menu-toggle {
            display: inline-flex;
          }

          .wl-header-actions {
            margin-left: 0;
            gap: 7px;
          }

          .wl-nav {
            display: none;
            order: 5;
            flex-basis: 100%;
            width: 100%;
            padding: 9px 0 3px;
            border-top: 1px solid var(--wl-border);
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
          }

          .wl-nav.is-open {
            display: flex;
          }

          .wl-nav-link {
            width: 100%;
            padding: 13px 12px;
            font-size: 14px;
          }

          .wl-header-actions .wl-admin-link {
            padding: 10px;
          }

          .wl-signout {
            padding: 10px 12px;
          }

          .wl-footer-inner {
            padding: 25px 18px;
            align-items: flex-start;
            flex-direction: column;
            gap: 18px;
          }

          .wl-footer-links {
            gap: 14px 18px;
          }
        }

        @media (max-width: 390px) {
          .wl-header-inner {
            padding-left: 12px;
            padding-right: 12px;
          }

          .wl-header-actions {
            gap: 5px;
          }

          .wl-admin-link {
            font-size: 11px;
          }

          .wl-signout {
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wl-app * {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>

      <header className="wl-header">
        <div className="wl-header-inner">
          <Link
            to="/"
            className="wl-logo"
            aria-label="Webli Literate home"
          >
            <BrandLogo />
          </Link>

          <button
            type="button"
            className="wl-menu-toggle"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="wl-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? '×' : '☰'}
          </button>

          <nav
            id="wl-navigation"
            className={`wl-nav${menuOpen ? ' is-open' : ''}`}
            aria-label="Main navigation"
          >
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>

            <NavLink to="/books" className={navClass}>
              Explore Books
            </NavLink>

            <NavLink to="/cart" className={navClass}>
              Cart
              {cartCount > 0 && (
                <span className="wl-cart-count">{cartCount}</span>
              )}
            </NavLink>

            <NavLink to="/purchases" className={navClass}>
              My Library
            </NavLink>

            <NavLink to="/contact" className={navClass}>
              Contact
            </NavLink>
          </nav>

          <div className="wl-header-actions">
            {adminChecked && isAdmin && (
              <Link to="/admin" className="wl-admin-link">
                Admin Panel
              </Link>
            )}

            {session && (
              <button
                type="button"
                className="wl-signout"
                disabled={signingOut}
                onClick={handleSignOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="wl-main">{children}</main>

      <footer className="wl-footer">
        <div className="wl-footer-inner">
          <div>
            <div className="wl-footer-brand">Webli Literate</div>
            <div className="wl-footer-note">
              A little knowledge, one book at a time.
            </div>
          </div>

          <nav className="wl-footer-links" aria-label="Legal and support">
            <Link to="/policy/terms">Terms</Link>
            <Link to="/policy/privacy">Privacy</Link>
            <Link to="/policy/refund">Refund Policy</Link>
            <Link to="/policy/copyright">Copyright</Link>
            <Link to="/contact">Support</Link>
          </nav>

          <div className="wl-footer-copy">
            © {new Date().getFullYear()} Webli Literate. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={<ProtectedPage><Home /></ProtectedPage>}
        />
        <Route
          path="/books"
          element={<ProtectedPage><Books /></ProtectedPage>}
        />
        <Route
          path="/books/:id"
          element={<ProtectedPage><BookDetail /></ProtectedPage>}
        />
        <Route
          path="/cart"
          element={<ProtectedPage><Cart /></ProtectedPage>}
        />
        <Route
          path="/purchases"
          element={<ProtectedPage><Purchases /></ProtectedPage>}
        />
        <Route
          path="/order/:reference"
          element={<ProtectedPage><OrderSuccess /></ProtectedPage>}
        />
        <Route
          path="/contact"
          element={<ProtectedPage><Contact /></ProtectedPage>}
        />
        <Route
          path="/policy/:key"
          element={<ProtectedPage><Policy /></ProtectedPage>}
        />

        <Route
          path="/admin"
          element={
            <AuthGuard>
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookList />} />
          <Route path="books/:id" element={<BookForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<Categories />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

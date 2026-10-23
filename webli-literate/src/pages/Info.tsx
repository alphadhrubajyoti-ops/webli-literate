
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { WHATSAPP } from '../lib/brand';

type Settings = Record<string, string>;

const styles = `
  .wl-page {
    --wl-ink: #20251f;
    --wl-green: #244b38;
    --wl-muted: #73786e;
    --wl-paper: #fbfaf6;
    --wl-line: #e8e6dd;
    min-height: 75vh;
    padding: 42px 16px 76px;
    color: var(--wl-ink);
    background: var(--wl-paper);
    font-family: Inter, system-ui, -apple-system, sans-serif;
  }

  .wl-page * { box-sizing: border-box; }

  .wl-container {
    max-width: 760px;
    margin: 0 auto;
  }

  .wl-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 35px;
  }

  .wl-logo {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 6px;
    background: var(--wl-green);
    color: white;
    font: 700 23px Georgia, serif;
  }

  .wl-brand-name {
    font: 700 23px Georgia, serif;
    letter-spacing: -.7px;
  }

  .wl-brand-caption {
    display: block;
    margin-top: 3px;
    color: var(--wl-muted);
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .wl-eyebrow {
    color: #5a765d;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .wl-page h1 {
    margin: 12px 0;
    font: 500 clamp(34px, 6vw, 48px)/1.12 Georgia, serif;
    letter-spacing: -1.5px;
    overflow-wrap: anywhere;
  }

  .wl-intro {
    margin: 0;
    color: var(--wl-muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .wl-panel {
    margin-top: 28px;
    padding: 28px;
    background: #fff;
    border: 1px solid var(--wl-line);
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(32,37,31,.025);
  }

  .wl-policy-text {
    margin: 0;
    color: #42473f;
    font-size: 14px;
    line-height: 1.95;
    overflow-wrap: anywhere;
  }

  .wl-muted-box {
    padding: 17px;
    background: #f4f3ec;
    border: 1px solid var(--wl-line);
    border-radius: 5px;
    color: var(--wl-muted);
    font-size: 13px;
    line-height: 1.8;
  }

  .wl-field {
    display: block;
    width: 100%;
    margin-top: 20px;
  }

  .wl-field label {
    display: block;
    margin-bottom: 8px;
    color: #383e36;
    font-size: 12px;
    font-weight: 700;
  }

  .wl-field input, .wl-field textarea {
    display: block;
    width: 100%;
    padding: 13px 14px;
    border: 1px solid #deded5;
    border-radius: 5px;
    background: #fffefa;
    color: var(--wl-ink);
    font: inherit;
    font-size: 14px;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
  }

  .wl-field input:focus, .wl-field textarea:focus {
    border-color: #54785c;
    box-shadow: 0 0 0 3px rgba(84,120,92,.1);
  }

  .wl-field textarea {
    resize: vertical;
    min-height: 140px;
  }

  .wl-primary, .wl-secondary {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 9px;
    min-height: 46px;
    padding: 12px 18px;
    border: 1px solid var(--wl-green);
    border-radius: 5px;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: background .2s, transform .2s;
  }

  .wl-primary {
    background: var(--wl-green);
    color: #fff;
  }

  .wl-primary:hover:not(:disabled) {
    background: #345e45;
    transform: translateY(-1px);
  }

  .wl-secondary {
    background: #fff;
    color: var(--wl-green);
  }

  .wl-secondary:hover {
    background: #eef1e9;
  }

  .wl-primary:disabled {
    opacity: .6;
    cursor: not-allowed;
  }

  .wl-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 24px;
  }

  .wl-status {
    margin-top: 18px;
    padding: 13px 15px;
    border: 1px solid var(--wl-line);
    border-radius: 5px;
    font-size: 13px;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }

  .wl-status.error {
    color: #913f32;
    background: #fff3f0;
    border-color: #f0d6ce;
  }

  .wl-status.success {
    color: #285b3c;
    background: #edf5ed;
    border-color: #d2e5d4;
  }

  .wl-contact-detail {
    padding: 17px 0;
    border-bottom: 1px solid var(--wl-line);
  }

  .wl-contact-detail:last-child { border-bottom: 0; }

  .wl-contact-detail span {
    display: block;
    margin-bottom: 7px;
    color: var(--wl-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .wl-contact-detail a {
    color: var(--wl-green);
    font-size: 14px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .wl-footer {
    max-width: 760px;
    margin: 32px auto 0;
    padding-top: 20px;
    border-top: 1px solid var(--wl-line);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    color: var(--wl-muted);
    font-size: 11px;
  }

  .wl-footer a {
    color: var(--wl-green);
    text-decoration: none;
    font-weight: 600;
  }

  @media (max-width: 480px) {
    .wl-page { padding: 28px 15px 48px; }
    .wl-panel { padding: 20px 16px; }
    .wl-actions { flex-direction: column; }
    .wl-actions > * { width: 100%; }
    .wl-footer { align-items: flex-start; flex-direction: column; }
  }
`;

function BrandHeader() {
  return (
    <Link
      to="/"
      className="wl-brand"
      aria-label="Webli Literate home"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span className="wl-logo">W.</span>
      <span>
        <span className="wl-brand-name">Webli Literate</span>
        <span className="wl-brand-caption">Your digital bookshelf</span>
      </span>
    </Link>
  );
}

function PageFooter() {
  return (
    <footer className="wl-footer">
      <span>© {new Date().getFullYear()} Webli Literate</span>
      <Link to="/books">Explore the bookstore ↗</Link>
    </footer>
  );
}

export function Policy() {
  const { key } = useParams<{ key: string }>();

  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPolicy() {
      setText(null);
      setFailed(false);

      if (!key || !/^[a-zA-Z0-9_-]+$/.test(key)) {
        setText('');
        setFailed(true);
        return;
      }

      const { data, error } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', `policy_${key}`)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setFailed(true);
        setText('');
        return;
      }

      setText(data?.value ?? '');
    }

    loadPolicy();

    return () => {
      active = false;
    };
  }, [key]);

  const title = (key || 'Policy')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <main className="wl-page">
      <style>{styles}</style>

      <div className="wl-container">
        <BrandHeader />

        <span className="wl-eyebrow">STORE INFORMATION</span>
        <h1>{title}</h1>
        <p className="wl-intro">
          Learn about our store policies and how they apply when using
          Webli Literate.
        </p>

        <article className="wl-panel">
          {text === null ? (
            <p className="wl-intro" role="status">
              Loading policy...
            </p>
          ) : failed ? (
            <div className="wl-muted-box" role="alert">
              We couldn't load this policy right now. Please try again later.
            </div>
          ) : text.trim() ? (
            <p className="wl-policy-text" style={{ whiteSpace: 'pre-wrap' }}>
              {text}
            </p>
          ) : (
            <div className="wl-muted-box">
              This policy has not been published yet. Please check back later
              or contact the store owner for more information.
            </div>
          )}
        </article>

        <div className="wl-actions">
          <Link to="/books" className="wl-secondary">
            ← Back to books
          </Link>
          <Link to="/contact" className="wl-primary">
            Contact support ↗
          </Link>
        </div>

        <PageFooter />
      </div>
    </main>
  );
}

export function Contact() {
  const [settings, setSettings] = useState<Settings>({});
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const { data, error } = await supabase
        .from('store_settings')
        .select('key,value');

      if (!active) return;

      if (!error && data) {
        setSettings(
          Object.fromEntries(
            data.map((row) => [row.key, String(row.value ?? '')])
          )
        );
      }

      setSettingsLoading(false);
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if (!cleanName || cleanName.length > 100) {
      setStatus('Please enter a name of up to 100 characters.');
      setStatusType('error');
      return;
    }

    if (cleanMessage.length < 5 || cleanMessage.length > 2000) {
      setStatus('Your message must be between 5 and 2,000 characters.');
      setStatusType('error');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setStatus('Please sign in before sending a support message.');
        setStatusType('error');
        return;
      }

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          user_id: authData.user.id,
          name: cleanName,
          message: cleanMessage,
        });

      if (error) {
        setStatus('Your message could not be sent. Please try again later.');
        setStatusType('error');
        return;
      }

      setName('');
      setMessage('');
      setStatus('Your message has been sent successfully. Thank you for contacting us!');
      setStatusType('success');
    } catch {
      setStatus('Something went wrong. Please try again later.');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  }

  const supportEmail = settings.support_email?.trim();
  const contactInfo = settings.contact_info?.trim();

  return (
    <main className="wl-page">
      <style>{styles}</style>

      <div className="wl-container">
        <BrandHeader />

        <span className="wl-eyebrow">WE'RE HERE TO HELP</span>
        <h1>Let's talk.</h1>
        <p className="wl-intro">
          Have a question about a book, a purchase, or your digital library?
          Send us a message and our team will be happy to help.
        </p>

        <section className="wl-panel">
          <h2 style={{ font: '500 25px Georgia, serif', margin: '0 0 8px' }}>
            Send us a message
          </h2>
          <p className="wl-intro">
            Fill in the details below so we can understand how to assist you.
          </p>

          <form onSubmit={sendMessage}>
            <div className="wl-field">
              <label htmlFor="wl-name">Your name</label>
              <input
                id="wl-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                disabled={loading}
              />
            </div>

            <div className="wl-field">
              <label htmlFor="wl-message">How can we help?</label>
              <textarea
                id="wl-message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minLength={5}
                maxLength={2000}
                required
                disabled={loading}
              />
              <span
                style={{
                  display: 'block',
                  marginTop: 7,
                  color: '#73786e',
                  textAlign: 'right',
                  fontSize: 11,
                }}
              >
                {message.length}/2000
              </span>
            </div>

            <div className="wl-actions">
              <button
                type="submit"
                className="wl-primary"
                disabled={loading}
              >
                {loading ? 'Sending message...' : 'Send message ↗'}
              </button>
            </div>

            {status && (
              <div
                className={`wl-status ${statusType}`}
                role={statusType === 'error' ? 'alert' : 'status'}
              >
                {status}
              </div>
            )}
          </form>
        </section>

        <section className="wl-panel">
          <span className="wl-eyebrow">OTHER WAYS TO REACH US</span>
          <h2 style={{ font: '500 25px Georgia, serif', margin: '10px 0' }}>
            Get in touch
          </h2>

          {settingsLoading ? (
            <p className="wl-intro">Loading contact information...</p>
          ) : (
            <>
              {contactInfo && (
                <div className="wl-contact-detail">
                  <span>Store information</span>
                  <p
                    className="wl-policy-text"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {contactInfo}
                  </p>
                </div>
              )}

              {supportEmail && (
                <div className="wl-contact-detail">
                  <span>Email support</span>
                  <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                </div>
              )}

              <div className="wl-contact-detail">
                <span>WhatsApp support</span>
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat with us on WhatsApp ↗
                </a>
              </div>
            </>
          )}
        </section>

        <div className="wl-actions">
          <Link to="/books" className="wl-secondary">
            ← Back to bookstore
          </Link>
        </div>

        <PageFooter />
      </div>
    </main>
  );
}

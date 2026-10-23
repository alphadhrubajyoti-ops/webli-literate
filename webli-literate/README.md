# Webli Literate (Cloudflare Pages + Supabase + Razorpay)
## Setup
1. Extract the ZIP, install Node 20+, run `npm install`, open in VS Code.
2. Supabase: create a project, SQL Editor, run `001_init.sql`, `002_admin.sql`, then `003_webhook_hardening.sql` in order (tables, RLS, admin functions, storage buckets `book-files` private, `covers` and `previews` public, admin-only storage write policy).
3. Copy `.env.example` to `.env` (Supabase URL + anon key only). Copy `.dev.vars.example` to `.dev.vars` (server secrets; never commit).
4. Google sign-in: Google Cloud Console, new project, OAuth consent screen (External), Credentials, OAuth client ID (Web). Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. Paste Client ID/Secret into Supabase, Authentication, Providers, Google. In Authentication, URL Configuration: set Site URL to your domain and add `http://localhost:8788/login` and `https://<your-domain>/login` as Redirect URLs.
5. First admin: sign in once, then in SQL Editor run: `insert into user_roles(user_id,role) select id,'admin' from auth.users where email='YOU@example.com';`
6. Logo: already at `public/images/webli-literate-logo.png`; replace the file to change it (path set in `src/lib/brand.ts`).
7. Run locally: `npm run build && npm run pages:dev` (http://localhost:8788).
8. Razorpay: use Test mode keys. Dashboard, Webhooks: URL `https://<your-domain>/api/razorpay-webhook`, events `payment.captured`, `order.paid`, `payment.failed` (nothing else is needed; refund events are not processed, record refunds in Admin, Orders), secret = `RAZORPAY_WEBHOOK_SECRET`.
9. Deploy: push to GitHub, Cloudflare Pages, connect repo, build command `npm run build`, output `dist`. Add `VITE_*` as build variables and the five server values as encrypted secrets. CLI alternative: `npx wrangler pages deploy dist`.
10. Backups: Supabase dashboard, Database, Backups; download book PDFs from Storage periodically.
## Cloudflare Pages deployment (details)
- Routing: static site from `dist` (SPA fallback via `public/_redirects`, security headers via `public/_headers`); every file in `functions/api/` with an `onRequestPost` export becomes `/api/<name>`. `_lib.ts` is a shared module, not a route.
- Functions use only `fetch`, Web Crypto and `btoa`, which the Workers runtime supports. No Node modules or Express.
- Build settings: framework Vite/None, build command `npm run build`, output directory `dist`, Node 20+.
- Browser-safe build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Settings, Variables, for Production and Preview).
- Server secrets (type Secret/Encrypted): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. If the dashboard will not let you edit them because `wrangler.toml` is present, use `npx wrangler pages secret put NAME --project-name webli-literate`. Secrets apply to the next deployment, so redeploy after adding them.
- Local functions test: `npm run build`, create `.dev.vars` from `.dev.vars.example`, then `npm run pages:dev` (http://localhost:8788). Never commit `.dev.vars` or `.env`.
- After deploying, add `https://<your-domain>/login` to Supabase Redirect URLs, and set the Razorpay webhook URL to `https://<your-domain>/api/razorpay-webhook`.
## Payment webhook behaviour
Signature check on the raw body, then the payment is re-fetched from the Razorpay API, then one database transaction (`process_razorpay_event`) checks the order, amount, currency and status and grants access. If anything fails the transaction rolls back and the endpoint returns 5xx so Razorpay retries; an event is only recorded as processed after success. Duplicates and `order.paid`+`payment.captured` pairs never create a second purchase. Mismatched or item-less orders are recorded and counted as "Payment events needing review" on the admin dashboard, with no access granted. Razorpay retries failed deliveries for a limited time; if one is exhausted, resend it from the Razorpay dashboard.
## Admin dashboard
Sign in, make yourself admin (step 5), then open `/admin` (an Admin link also appears in the header).
- **Categories** first: add a few. **Books, Add book**: fill details, choose cover, optional sample pages (images or PDF), and the full PDF, then Save. Publishing requires a full PDF. Leave "Final price override" blank to use the discount; Customer pays shows the result.
- **Orders**: search by reference, filter by status, export CSV. "Record refund" marks the order refunded and revokes access, but does NOT send money back: refund in the Razorpay dashboard too.
- **Settings**: support email, contact text and the four policy texts (replace the template wording after legal review).
- Admin rights are enforced by Supabase RLS and the `is_admin()` function, not by the page; the service-role key is only used in the Cloudflare functions.
## Styling
Tailwind CSS v3 (PostCSS) is configured in `tailwind.config.js` and `postcss.config.js`. Brand colors and fonts (Montserrat + Figtree) live in the Tailwind theme; shared button, form, card and table classes are in `src/index.css`. The logo used in the app is the trimmed `public/images/webli-literate-logo-trim.png` (path in `src/lib/brand.ts`); the original logo file is kept. `public/_headers` ships a Content-Security-Policy in report-only mode; after checking the browser console on a live test payment shows no violations, rename it to `Content-Security-Policy` to enforce it.
## Tests
`npm test` runs price/validation tests, the admin save-flow test (fake Supabase client), and database tests (RLS, storage policies, admin functions, webhook function) against an in-memory Postgres with stubbed Supabase auth/storage. The webhook tests run the real Cloudflare handler code with a fake Razorpay API.
## Not built yet
Manual UPI mode, automatic Razorpay refund API call, in-app PDF reader (Read opens a 5-minute signed URL), server-side upload byte-progress, payment verification endpoint beyond the webhook, request rate limiting for functions, sales-based "bestsellers". Not tested live: Google sign-in, Razorpay checkout/webhook, signed PDF URLs, storage uploads, Cloudflare deployment.

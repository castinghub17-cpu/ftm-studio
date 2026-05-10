/**
 * FTM Studio — Cloudflare Worker
 * Handles: Stripe Checkout sessions + static asset serving
 *
 * Environment variables required (set in Cloudflare dashboard → Workers → Settings → Variables):
 *   STRIPE_SECRET_KEY  →  sk_live_xxxxxxxxxxxxxxxxxxxx
 *
 * Payment methods enabled on Stripe Checkout page (configured in your Stripe dashboard):
 *   Card · Klarna · Clearpay (Afterpay)
 */

// ── PACKAGE CATALOGUE ────────────────────────────────────────────────────────
const PACKAGES = {
  'deal-1': {
    name:        'Portfolio Shoot — Deal 1',
    description: '2 outfit changes · 40 photos · 2 retouched images · Hair & Makeup included',
    price:       92000,   // pence (£920.00)
  },
  'deal-2': {
    name:        'Portfolio Shoot — Deal 2',
    description: '3 outfit changes · 60 photos · 4 retouched images · Hair & Makeup included',
    price:       99900,   // pence (£999.00)
  },
  'deal-3': {
    name:        'Portfolio Shoot — Deal 3',
    description: '4 outfit changes · 80 photos · 6 retouched images · Hair & Makeup included',
    price:       110000,  // pence (£1,100.00)
  },
};

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return corsResponse();
    }

    // ── API: Create Stripe Checkout Session ──
    if (path === '/create-checkout' && method === 'POST') {
      return handleCheckout(request, env);
    }

    // ── Static pages ──
    if (path === '/success') {
      return new Response(SUCCESS_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (path === '/cancel') {
      return new Response(CANCEL_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // ── Everything else → serve static assets (index.html, images, etc.) ──
    return env.ASSETS.fetch(request);
  },
};

// ── STRIPE CHECKOUT ───────────────────────────────────────────────────────────
async function handleCheckout(request, env) {
  try {
    const body = await request.json();
    const pkg  = PACKAGES[body.packageId];

    if (!pkg) {
      return jsonError('Invalid package selected.', 400);
    }

    const origin = new URL(request.url).origin;

    // Build Stripe Checkout Session request
    // Using URLSearchParams for Stripe's form-encoded API
    const params = new URLSearchParams();

    // Mode
    params.append('mode', 'payment');

    // Line item — kept minimal for maximum compatibility
    params.append('line_items[0][price_data][currency]',             'gbp');
    params.append('line_items[0][price_data][product_data][name]',   pkg.name);
    params.append('line_items[0][price_data][unit_amount]',          String(pkg.price));
    params.append('line_items[0][quantity]',                         '1');
    params.append('allow_promotion_codes',                           'true');
    params.append('success_url', `${origin}/success`);
    params.append('cancel_url',  `${origin}/#deals`);

    // Call Stripe API
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error('Stripe error:', JSON.stringify(session.error));
      return jsonError(session.error.message || 'Stripe error.', 500);
    }

    return jsonResponse({ url: session.url });

  } catch (err) {
    console.error('Checkout error:', err.message);
    return jsonError('Server error. Please try again.', 500);
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function jsonError(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

function corsResponse() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ── SUCCESS PAGE ──────────────────────────────────────────────────────────────
const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Booking Confirmed — FTM Studio</title>
<link rel="icon" type="image/x-icon" href="/favicon.ico"/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Inter:wght@200;300;400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#18181a;--ink40:#97979c;--b100:#f8f5f0;--b200:#f0ebe2;--line:#e8e3dc;--white:#fff;--ease:cubic-bezier(.16,1,.3,1)}
body{font-family:'Inter',system-ui,sans-serif;background:var(--b100);color:var(--ink);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px}
.card{background:var(--white);border:1px solid var(--line);max-width:500px;width:100%;padding:60px 52px;text-align:center}
.check{width:60px;height:60px;border-radius:50%;background:#f0f7f0;display:flex;align-items:center;justify-content:center;margin:0 auto 32px}
.check svg{width:30px;height:30px;stroke:#3a7d44;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
h1{font-family:'Syne',sans-serif;font-size:30px;font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
p{font-size:13.5px;font-weight:300;color:var(--ink40);line-height:1.75;margin-bottom:36px}
.cta{display:inline-block;padding:14px 40px;background:var(--ink);color:var(--white);font-family:'Inter',sans-serif;font-size:10.5px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;text-decoration:none;transition:opacity .2s}
.cta:hover{opacity:.75}
.small{font-size:11px;color:var(--ink40);margin-top:20px;margin-bottom:0}
</style>
</head>
<body>
<div class="card">
  <div class="check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
  <h1>Booking Confirmed!</h1>
  <p>Thank you for booking with FTM Photography &amp; Management. A confirmation email has been sent to you.<br><br>We'll be in touch within 24 hours to confirm your session date and go through all the details.</p>
  <a href="/" class="cta">Back to FTM Studio</a>
  <p class="small">Questions? Email us at <a href="mailto:admin@ftmmanagement.space" style="color:var(--ink)">admin@ftmmanagement.space</a></p>
</div>
</body>
</html>`;

// ── CANCEL PAGE ───────────────────────────────────────────────────────────────
const CANCEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Payment Cancelled — FTM Studio</title>
<link rel="icon" type="image/x-icon" href="/favicon.ico"/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Inter:wght@200;300;400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#18181a;--ink40:#97979c;--b100:#f8f5f0;--line:#e8e3dc;--white:#fff}
body{font-family:'Inter',system-ui,sans-serif;background:var(--b100);color:var(--ink);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px}
.card{background:var(--white);border:1px solid var(--line);max-width:500px;width:100%;padding:60px 52px;text-align:center}
h1{font-family:'Syne',sans-serif;font-size:30px;font-weight:800;letter-spacing:-.02em;margin-bottom:12px}
p{font-size:13.5px;font-weight:300;color:var(--ink40);line-height:1.75;margin-bottom:36px}
.btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.cta{display:inline-block;padding:13px 32px;background:var(--ink);color:var(--white);font-family:'Inter',sans-serif;font-size:10.5px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;text-decoration:none;transition:opacity .2s}
.cta:hover{opacity:.75}
.cta.sec{background:transparent;color:var(--ink);border:1px solid var(--line)}
.cta.sec:hover{background:var(--ink);color:var(--white)}
</style>
</head>
<body>
<div class="card">
  <h1>Payment Cancelled</h1>
  <p>No payment was taken — don't worry! If you had any trouble completing your booking, get in touch and we'll sort it out for you.</p>
  <div class="btns">
    <a href="/#deals" class="cta">View Packages</a>
    <a href="/#contact" class="cta sec">Contact Us</a>
  </div>
</div>
</body>
</html>`;

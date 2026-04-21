export const config = { runtime: 'edge' };

// J-Quants Free plan: 12-week delayed data.
// Auth flow: JQUANTS_API_KEY = refresh token → exchange for ID token → fetch quotes.

const BASE = 'https://api.jquants.com/v1';

const TARGET_STOCKS = [
  { code: '7203', name: 'トヨタ自動車' },
  { code: '6758', name: 'ソニーG' },
  { code: '8306', name: '三菱UFJ' },
  { code: '9984', name: 'ソフトバンクG' },
  { code: '6861', name: 'キーエンス' },
];

async function getIdToken(refreshToken) {
  const res = await fetch(
    `${BASE}/token/auth_refresh?refreshtoken=${encodeURIComponent(refreshToken)}`,
    { method: 'POST', signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`auth_refresh ${res.status}: ${body.slice(0, 120)}`);
  }
  const data = await res.json();
  const token = data.idToken ?? data.id_token;
  if (!token) throw new Error('idToken missing in response');
  return token;
}

async function fetchDailyQuote(code, idToken) {
  const res = await fetch(`${BASE}/prices/daily_quotes?code=${code}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.daily_quotes?.[0] ?? null;
}

function buildResult({ code, name }, q) {
  if (!q) return { code, name, price: '--', change: '--', changePercent: '--', up: true, delayed: true };
  const price = q.Close ?? q.AdjustmentClose ?? null;
  const prev  = q.PreviousClose ?? q.AdjustmentPreviousClose ?? null;
  const change    = price != null && prev != null ? price - prev : null;
  const changePct = change != null && prev ? (change / prev) * 100 : null;
  const up = change != null ? change >= 0 : true;
  return {
    code,
    name,
    date: q.Date ?? '',
    price: price != null
      ? price.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
      : '--',
    change:        change    != null ? `${up ? '+' : ''}${change.toFixed(1)}`     : '--',
    changePercent: changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '--',
    up,
    delayed: true,
  };
}

export default async function handler(req) {
  const refreshToken = process.env.JQUANTS_API_KEY;
  if (!refreshToken) {
    return new Response(
      JSON.stringify({ error: 'JQUANTS_API_KEY (refresh token) not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(req.url);
  const codeFilter = searchParams.get('code');
  const stocks = codeFilter
    ? TARGET_STOCKS.filter((s) => s.code === codeFilter)
    : TARGET_STOCKS;

  let idToken;
  try {
    idToken = await getIdToken(refreshToken);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'J-Quants token exchange failed', detail: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const quotes = await Promise.all(
    stocks.map(async (stock) => {
      try {
        const q = await fetchDailyQuote(stock.code, idToken);
        return buildResult(stock, q);
      } catch {
        return buildResult(stock, null);
      }
    })
  );

  return new Response(JSON.stringify(quotes), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

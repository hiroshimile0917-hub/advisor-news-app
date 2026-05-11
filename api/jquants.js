export const config = { runtime: 'edge' };

// J-Quants API V2 (post 2025-12-22 registrations).
// Auth: JQUANTS_API_KEY = API key sent as `x-api-key` header. No token exchange.
// Endpoint: /v2/equities/bars/daily (renamed from /v1/prices/daily_quotes).
// Response wrapper: { data: [...] } with abbreviated field names (O,H,L,C,Vo,...).
// Stock codes: V2 requires 5-digit codes (4-digit + trailing "0").
// Migration ref: https://jpx-jquants.com/en/spec/migration-v1-v2

const BASE = 'https://api.jquants.com/v2';

// 4-digit codes; the API call appends "0" to form the V2 5-digit code.
const TARGET_STOCKS = [
  { code: '7203', name: 'トヨタ自動車' },
  { code: '6758', name: 'ソニーG' },
  { code: '8306', name: '三菱UFJ' },
  { code: '9984', name: 'ソフトバンクG' },
  { code: '6861', name: 'キーエンス' },
];

// V2 uses 5-digit codes (4-digit symbol + "0" check digit for ordinary equities).
function toV2Code(code) {
  return code.length === 5 ? code : `${code}0`;
}

async function fetchDailyQuote(code, apiKey) {
  const v2Code = toV2Code(code);
  const res = await fetch(`${BASE}/equities/bars/daily?code=${v2Code}`, {
    headers: { 'x-api-key': apiKey },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const arr = json?.data;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  // Sort by Date desc (ISO YYYY-MM-DD strings sort lexicographically) and take latest two.
  const sorted = [...arr].sort((a, b) => String(b.Date).localeCompare(String(a.Date)));
  return { latest: sorted[0], previous: sorted[1] ?? null };
}

function buildResult({ code, name }, q) {
  if (!q || !q.latest) {
    return { code, name, price: '--', change: '--', changePercent: '--', up: true, delayed: true };
  }
  const cur  = q.latest;
  const prev = q.previous;
  // V2 abbreviated field names: C = Close, AdjC = AdjustmentClose
  const price    = cur.C  ?? cur.AdjC  ?? null;
  const prevPrice = prev ? (prev.C ?? prev.AdjC ?? null) : null;
  const change    = price != null && prevPrice != null ? price - prevPrice : null;
  const changePct = change != null && prevPrice ? (change / prevPrice) * 100 : null;
  const up = change != null ? change >= 0 : true;
  return {
    code,
    name,
    date: cur.Date ?? '',
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
  const apiKey = process.env.JQUANTS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'JQUANTS_API_KEY not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(req.url);
  const codeFilter = searchParams.get('code');
  const stocks = codeFilter
    ? TARGET_STOCKS.filter((s) => s.code === codeFilter)
    : TARGET_STOCKS;

  const quotes = await Promise.all(
    stocks.map(async (stock) => {
      try {
        const q = await fetchDailyQuote(stock.code, apiKey);
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

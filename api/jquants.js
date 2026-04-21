export const config = { runtime: 'edge' };

// J-Quants V2 API — Free plan provides 12-week delayed data.
// Intended for watchlist stock detail display, NOT real-time market ticker.

const JQUANTS_BASE = 'https://api.jquants.com/v2';

const TARGET_STOCKS = [
  { code: '7203', name: 'トヨタ自動車' },
  { code: '6758', name: 'ソニーG' },
  { code: '8306', name: '三菱UFJ' },
  { code: '9984', name: 'ソフトバンクG' },
  { code: '6861', name: 'キーエンス' },
];

async function fetchDailyQuote(code, apiKey) {
  const res = await fetch(`${JQUANTS_BASE}/prices/daily_quotes?code=${code}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.daily_quotes?.[0] ?? null;
}

export default async function handler(req) {
  const apiKey = process.env.JQUANTS_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'JQUANTS_API_KEY not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // optional: filter by code query param (?code=7203)
  const { searchParams } = new URL(req.url);
  const codeFilter = searchParams.get('code');
  const stocks = codeFilter
    ? TARGET_STOCKS.filter((s) => s.code === codeFilter)
    : TARGET_STOCKS;

  try {
    const quotes = await Promise.all(
      stocks.map(async ({ code, name }) => {
        try {
          const q = await fetchDailyQuote(code, apiKey);
          if (!q) return { code, name, price: '--', change: '--', changePercent: '--', up: true, delayed: true };

          const price = q.Close ?? q.AdjustmentClose ?? null;
          const prev  = q.PreviousClose ?? q.AdjustmentPreviousClose ?? null;
          const change = price != null && prev != null ? price - prev : null;
          const changePct = change != null && prev ? (change / prev) * 100 : null;
          const up = change != null ? change >= 0 : true;

          return {
            code,
            name,
            date: q.Date ?? '',
            price: price != null
              ? price.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
              : '--',
            change: change != null ? `${up ? '+' : ''}${change.toFixed(1)}` : '--',
            changePercent: changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '--',
            up,
            delayed: true, // Free plan = 12-week delay
          };
        } catch {
          return { code, name, price: '--', change: '--', changePercent: '--', up: true, delayed: true };
        }
      })
    );

    return new Response(JSON.stringify(quotes), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1時間キャッシュ（遅延データのため長め）
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'J-Quants API error', detail: err.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

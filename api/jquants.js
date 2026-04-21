export const config = { runtime: 'edge' };

// J-Quants — Free plan: 12-week delayed data.
// Used for watchlist stock detail display, NOT real-time market ticker.
// Base URL: v1 is the documented stable version; v2 is used if available.

const BASES = [
  'https://api.jquants.com/v1',
  'https://api.jpx-jquants.com/v1',
];

const TARGET_STOCKS = [
  { code: '7203', name: 'トヨタ自動車' },
  { code: '6758', name: 'ソニーG' },
  { code: '8306', name: '三菱UFJ' },
  { code: '9984', name: 'ソフトバンクG' },
  { code: '6861', name: 'キーエンス' },
];

async function probeBase(base, apiKey) {
  const res = await fetch(`${base}/prices/daily_quotes?code=7203`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  return { status: res.status, base, body: text.slice(0, 300) };
}

async function fetchDailyQuote(base, code, apiKey) {
  const res = await fetch(`${base}/prices/daily_quotes?code=${code}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // J-Quants returns most recent entry first
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

  const { searchParams } = new URL(req.url);

  // ?debug=1 — probe both base URLs and return raw response for diagnosis
  if (searchParams.get('debug') === '1') {
    const probes = await Promise.all(BASES.map((b) => probeBase(b, apiKey).catch((e) => ({ base: b, error: e.message }))));
    return new Response(JSON.stringify(probes, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const codeFilter = searchParams.get('code');
  const stocks = codeFilter
    ? TARGET_STOCKS.filter((s) => s.code === codeFilter)
    : TARGET_STOCKS;

  // Try each base URL until one works
  let workingBase = null;
  for (const base of BASES) {
    try {
      const res = await fetch(`${base}/prices/daily_quotes?code=7203`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) { workingBase = base; break; }
    } catch { /* try next */ }
  }

  if (!workingBase) {
    return new Response(
      JSON.stringify({ error: 'J-Quants API unreachable — check JQUANTS_API_KEY', apiKeyPresent: !!apiKey }),
      { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const quotes = await Promise.all(
    stocks.map(async ({ code, name }) => {
      try {
        const q = await fetchDailyQuote(workingBase, code, apiKey);
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
      } catch {
        return { code, name, price: '--', change: '--', changePercent: '--', up: true, delayed: true };
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

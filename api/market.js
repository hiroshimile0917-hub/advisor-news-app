export const config = { runtime: 'edge' };

const SYMBOLS = [
  { symbol: '^N225',   label: '日経225',   decimals: 0, suffix: '' },
  { symbol: '^TPX',    label: 'TOPIX',     decimals: 2, suffix: '' },
  { symbol: 'USDJPY=X', label: 'USD/JPY',  decimals: 2, suffix: '' },
  { symbol: '^GSPC',   label: 'S&P500',    decimals: 0, suffix: '' },
  { symbol: '^TNX',    label: '米10年債',   decimals: 3, suffix: '%' },
];

function fmt(value, decimals, suffix) {
  if (value == null || isNaN(value)) return '--';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + suffix;
}

async function fetchSymbol({ symbol, label, decimals, suffix }) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=1d&range=1d`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? null;
    const prev  = meta?.chartPreviousClose ?? meta?.previousClose ?? null;

    const change = price != null && prev != null ? price - prev : null;
    const changePct = change != null && prev ? (change / prev) * 100 : null;
    const up = change != null ? change >= 0 : true;

    const changeStr = changePct != null
      ? `${up ? '+' : ''}${changePct.toFixed(2)}%`
      : '--';

    return { symbol, label, value: fmt(price, decimals, suffix), change: changeStr, up };
  } catch {
    return { symbol, label, value: '--', change: '--', up: true };
  }
}

export default async function handler() {
  const results = await Promise.all(SYMBOLS.map(fetchSymbol));

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

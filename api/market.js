export const config = { runtime: 'edge' };

// Primary: Yahoo Finance (unofficial, no key needed)
// Fallback: Twelve Data (API key, when Yahoo fails per symbol)

const SYMBOLS = [
  {
    label: '日経225',
    yhSymbol: '^N225',
    tdSymbol: '8411.T',   // 三菱UFJ as proxy (index requires paid plan)
    decimals: 0,
    suffix: '',
  },
  {
    label: 'TOPIX',
    yhSymbol: '^TPX',
    tdSymbol: null,        // no reliable Twelve Data substitute
    decimals: 2,
    suffix: '',
  },
  {
    label: 'USD/JPY',
    yhSymbol: 'USDJPY=X',
    tdSymbol: 'USD/JPY',
    decimals: 2,
    suffix: '',
  },
  {
    label: 'S&P500',
    yhSymbol: '^GSPC',
    tdSymbol: 'SPX',
    decimals: 0,
    suffix: '',
  },
  {
    label: '米10年債',
    yhSymbol: '^TNX',
    tdSymbol: null,        // Twelve Data doesn't carry US10Y on free plan
    decimals: 3,
    suffix: '%',
  },
];

function fmt(value, decimals, suffix) {
  if (value == null || isNaN(value)) return '--';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + suffix;
}

// ── Yahoo Finance ─────────────────────────────────────────────────────────────
async function fetchYahoo({ yhSymbol, label, decimals, suffix }) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yhSymbol)}` +
    `?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice ?? null;
  const prev  = meta?.chartPreviousClose ?? meta?.previousClose ?? null;
  if (price == null) throw new Error('no price');
  const change    = prev != null ? price - prev : null;
  const changePct = change != null && prev ? (change / prev) * 100 : null;
  const up = change != null ? change >= 0 : true;
  return {
    label,
    value:  fmt(price, decimals, suffix),
    change: changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '--',
    up,
    source: 'yahoo',
  };
}

// ── Twelve Data ───────────────────────────────────────────────────────────────
async function fetchTwelveData(tdSymbol, { label, decimals, suffix }, apiKey) {
  const url =
    `https://api.twelvedata.com/price?symbol=${encodeURIComponent(tdSymbol)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`TD ${res.status}`);
  const json = await res.json();
  if (json.status === 'error' || !json.price) throw new Error(json.message ?? 'no price');
  const price = parseFloat(json.price);

  // Twelve Data /price doesn't return previous close, so we can't compute change
  // Use /quote for change info — but that costs more credits. Return price only.
  return {
    label,
    value:  fmt(price, decimals, suffix),
    change: '--',   // change unavailable from /price endpoint
    up:     true,
    source: 'twelvedata',
  };
}

// ── Per-symbol fetch with fallback ────────────────────────────────────────────
async function fetchSymbol(sym, apiKey) {
  // 1. Try Yahoo Finance
  try {
    return await fetchYahoo(sym);
  } catch {
    // 2. Try Twelve Data if a symbol mapping exists and key is set
    if (sym.tdSymbol && apiKey) {
      try {
        return await fetchTwelveData(sym.tdSymbol, sym, apiKey);
      } catch {
        // fall through
      }
    }
    // 3. Both failed
    return { label: sym.label, value: '--', change: '--', up: true, source: 'none' };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler() {
  const apiKey = process.env.TWELVE_DATA_API_KEY ?? null;
  const results = await Promise.all(SYMBOLS.map((sym) => fetchSymbol(sym, apiKey)));

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

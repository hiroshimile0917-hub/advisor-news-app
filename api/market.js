export const config = { runtime: 'edge' };

// Data sources priority varies per symbol:
// - TOPIX: JPX official JSON. Stooq ^tpx returns HTTP 404.
// - Nikkei (^N225): Stooq primary — Yahoo serves stale data from non-JP IPs
//   (e.g. Vercel Edge gets yesterday's close as "current" price for ^N225;
//    ^TPX returns a wrong defunct ticker on Yahoo)
// - Others (USD/JPY, ^GSPC, ^TNX): Yahoo primary, Stooq fallback
// - Twelve Data: final fallback for symbols where it has good free-tier coverage

const SYMBOLS = [
  {
    label: '日経225',
    stSymbol: '^nkx',           // Stooq Nikkei 225
    yhSymbol: '^N225',
    tdSymbol: null,             // Twelve Data free tier doesn't have N225
    decimals: 0,
    suffix: '',
    preferStooq: true,
  },
  {
    label: 'TOPIX',
    jpx: true,
    stSymbol: null,           // JPX is used for TOPIX; no invalid Stooq mapping
    yhSymbol: null,
    tdSymbol: null,             // TPX on Twelve Data is a US stock (Tempur Sealy)
    decimals: 2,
    suffix: '',
    preferStooq: true,
  },
  {
    label: 'USD/JPY',
    stSymbol: 'usdjpy',
    yhSymbol: 'USDJPY=X',
    tdSymbol: 'USD/JPY',
    decimals: 2,
    suffix: '',
    preferStooq: false,
  },
  {
    label: 'S&P500',
    stSymbol: '^spx',
    yhSymbol: '^GSPC',
    tdSymbol: 'SPX',
    decimals: 0,
    suffix: '',
    preferStooq: false,
  },
  {
    label: 'NASDAQ',
    stSymbol: '^ndq',
    yhSymbol: '^IXIC',
    tdSymbol: 'IXIC',
    decimals: 0,
    suffix: '',
    preferStooq: false,
  },
  {
    label: '米10年債',
    stSymbol: '10usy.b',
    yhSymbol: '^TNX',
    tdSymbol: null,
    decimals: 3,
    suffix: '%',
    preferStooq: false,
  },
  {
    label: '日10年債',
    stSymbol: '10jpy.b',
    yhSymbol: null,             // Yahoo doesn't have a stable JP10Y ticker
    tdSymbol: null,
    decimals: 3,
    suffix: '%',
    preferStooq: true,
  },
];

function fmt(value, decimals, suffix) {
  if (value == null || isNaN(value)) return '--';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + suffix;
}

// ── Stooq.com (no auth, CSV) ─────────────────────────────────────────────────
// Live endpoint returns today's OHLC. Change% is computed as intraday open→close
// (not vs previous close) because the live endpoint doesn't include prev close.
async function fetchStooq({ stSymbol, label, decimals, suffix }) {
  if (!stSymbol) throw new Error('no Stooq symbol');
  const url =
    `https://stooq.com/q/l/?s=${encodeURIComponent(stSymbol)}&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`Stooq ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('Stooq empty');
  // CSV: Symbol,Date,Time,Open,High,Low,Close,Volume
  const cols = lines[1].split(',');
  if (cols.length < 7) throw new Error('Stooq malformed');
  const open  = parseFloat(cols[3]);
  const close = parseFloat(cols[6]);
  if (isNaN(close)) throw new Error('Stooq no close');
  const change    = !isNaN(open) ? close - open : null;
  const changePct = change != null && open ? (change / open) * 100 : null;
  const up = change != null ? change >= 0 : true;
  return {
    label,
    value:  fmt(close, decimals, suffix),
    change: changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '--',
    up,
    source: 'stooq',
  };
}

// ── Yahoo Finance ─────────────────────────────────────────────────────────────
async function fetchYahoo({ yhSymbol, label, decimals, suffix }) {
  if (!yhSymbol) throw new Error('no Yahoo symbol');
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

// JPX公式ページ https://www.jpx.co.jp/markets/indices/realvalues/ のJSON。
// previousDayRatioは前日終値比。配当込み指数やETFではなくTopix.Topixを選ぶ。
export function parseJpxTopix(json, sym) {
  const row = json?.Topix?.Topix;
  const number = value => {
    if (value == null || String(value).trim() === '') return null;
    const parsed = Number(String(value).replaceAll(',', ''));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const price = number(row?.currentPrice);
  const pct = number(row?.previousDayRatio);
  if (price == null || price <= 0) throw new Error('JPX TOPIX missing/invalid currentPrice');
  return { label: sym.label, value: fmt(price, sym.decimals, sym.suffix),
    change: pct == null ? '--' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
    up: pct == null || pct >= 0, source: 'jpx' };
}

async function fetchJpx(sym) {
  const res = await fetch('https://www.jpx.co.jp/market/indices/indices_stock_price3.txt', {
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`JPX HTTP ${res.status}`);
  return parseJpxTopix(await res.json(), sym);
}

// 失敗は部分成功時にもレスポンスに残す。キーを含むURL・例外本文は出力しない。
export async function fetchSymbol(sym, apiKey) {
  const chain = sym.jpx ? [['jpx', () => fetchJpx(sym)]] : sym.preferStooq
    ? [['stooq', () => fetchStooq(sym)], ['yahoo', () => fetchYahoo(sym)]]
    : [['yahoo', () => fetchYahoo(sym)], ['stooq', () => fetchStooq(sym)]];
  if (sym.tdSymbol && apiKey) chain.push(['twelvedata', () => fetchTwelveData(sym.tdSymbol, sym, apiKey)]);
  const errors = [];
  for (const [source, fetcher] of chain) {
    try {
      return { ...await fetcher(), ...(errors.length ? { errors } : {}) };
    } catch (error) {
      const reason = /^(JPX|Stooq|Yahoo|TD) (HTTP )?\d{3}$/.test(error.message)
        || /^(JPX TOPIX missing\/invalid currentPrice|Stooq (empty|malformed|no close)|no price|no Yahoo symbol|no Stooq symbol)$/.test(error.message)
        ? error.message : `${source} request failed (${error.name || 'Error'})`;
      errors.push({ source, reason });
      console.error('market source failure', { label: sym.label, source, reason });
    }
  }
  return { label: sym.label, value: '--', change: '--', up: true, source: 'none', errors };
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

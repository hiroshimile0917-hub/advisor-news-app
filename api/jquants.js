export const config = { runtime: 'edge' };

const JQUANTS_BASE = 'https://api.jpx-jquants.com/v1';

const TARGET_STOCKS = [
  { code: '7203', name: 'トヨタ自動車' },
  { code: '6758', name: 'ソニーG' },
  { code: '8306', name: '三菱UFJ' },
  { code: '9984', name: 'ソフトバンクG' },
  { code: '6861', name: 'キーエンス' },
  { code: '8035', name: '東京エレクトロン' },
  { code: '9432', name: 'NTT' },
  { code: '6367', name: 'ダイキン工業' },
  { code: '7974', name: '任天堂' },
  { code: '4063', name: '信越化学工業' },
];

async function getRefreshToken(email, password) {
  const res = await fetch(`${JQUANTS_BASE}/token/auth_user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mailaddress: email, password }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`auth_user failed: ${res.status}`);
  const data = await res.json();
  return data.refreshToken;
}

async function getIdToken(refreshToken) {
  const res = await fetch(`${JQUANTS_BASE}/token/auth_refresh?refreshtoken=${refreshToken}`, {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`auth_refresh failed: ${res.status}`);
  const data = await res.json();
  return data.idToken;
}

async function fetchDailyQuote(code, idToken) {
  const res = await fetch(`${JQUANTS_BASE}/prices/daily_quotes?code=${code}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // most recent trading day is first entry
  return data?.daily_quotes?.[0] ?? null;
}

export default async function handler() {
  const email = process.env.JQUANTS_EMAIL;
  const password = process.env.JQUANTS_PASSWORD;

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'JQUANTS_EMAIL / JQUANTS_PASSWORD not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const refreshToken = await getRefreshToken(email, password);
    const idToken = await getIdToken(refreshToken);

    const quotes = await Promise.all(
      TARGET_STOCKS.map(async ({ code, name }) => {
        try {
          const q = await fetchDailyQuote(code, idToken);
          if (!q) return { code, name, price: '--', change: '--', changePercent: '--' };

          const price = q.Close ?? q.AdjustmentClose ?? null;
          const prev  = q.PreviousClose ?? null;
          const change = price != null && prev != null ? price - prev : null;
          const changePct = change != null && prev ? (change / prev) * 100 : null;
          const up = change != null ? change >= 0 : true;

          return {
            code,
            name,
            price: price != null ? price.toLocaleString('ja-JP', { maximumFractionDigits: 1 }) : '--',
            change: change != null ? `${up ? '+' : ''}${change.toFixed(1)}` : '--',
            changePercent: changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '--',
            up,
          };
        } catch {
          return { code, name, price: '--', change: '--', changePercent: '--', up: true };
        }
      })
    );

    return new Response(JSON.stringify(quotes), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',  // 5分キャッシュ（株価は日次データ）
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

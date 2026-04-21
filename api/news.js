export const config = { runtime: 'edge' };

const RSS_FEEDS = [
  { url: 'https://www.boj.or.jp/rss/whatsnew.xml', source: '日本銀行' },
  { url: 'https://www.nhk.or.jp/rss/news/cat6.xml', source: 'NHK経済' },
  { url: 'https://toyokeizai.net/list/feed/rss', source: '東洋経済オンライン' },
  { url: 'https://feeds.japan.cnet.com/rss/cnet/all.rdf', source: 'CNET Japan' },
];

const RSS2JSON = 'https://api.rss2json.com/v1/api.json';

const CATEGORIES = [
  { id: 'domestic-equity', keywords: ['日経', '東証', 'JPX', '国内株', 'TOPIX', '株価'] },
  { id: 'us-equity', keywords: ['NYSE', 'NASDAQ', 'S&P500', 'ダウ', '米国株'] },
  { id: 'eu-equity', keywords: ['DAX', 'FTSE', 'ユーロストックス', '欧州株'] },
  { id: 'em-equity', keywords: ['新興国', '中国株', 'インド株', 'MSCI EM'] },
  { id: 'bonds', keywords: ['国債', '利回り', 'Fed', '金利', '債券'] },
  { id: 'forex', keywords: ['円安', '円高', 'ドル円', 'FX', '為替'] },
  { id: 'fund-etf', keywords: ['投資信託', 'ETF', 'ファンド', 'つみたてNISA'] },
  { id: 'regulation', keywords: ['金融庁', '規制', 'NISA', 'iDeCo', '制度改正', '法律'] },
  { id: 'macro', keywords: ['GDP', 'CPI', 'インフレ', '景気', 'マクロ', '物価', '金融政策'] },
  { id: 'corporate-ir', keywords: ['決算', '業績', '配当', 'IR', '株主'] },
  { id: 'crypto', keywords: ['ビットコイン', '暗号資産', 'イーサリアム', 'crypto', 'BTC'] },
];

const HIGH_KEYWORDS = ['緊急', '速報', '利上げ', '利下げ', '破綻', '急落', '急騰', 'ショック', '危機', '政策決定'];
const LOW_KEYWORDS = ['コラム', '解説', 'まとめ', '振り返り', 'レポート'];

function detectCategory(title, description) {
  const text = `${title} ${description ?? ''}`;
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.id;
  }
  return 'macro';
}

function detectImportance(title) {
  if (HIGH_KEYWORDS.some((kw) => title.includes(kw))) return '高';
  if (LOW_KEYWORDS.some((kw) => title.includes(kw))) return '低';
  return '中';
}

function toId(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
}

function stripHtml(html) {
  return (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

async function fetchFeed({ url, source }) {
  try {
    const apiUrl = `${RSS2JSON}?rss_url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) return [];

    return data.items.map((item) => {
      const title = item.title?.trim() ?? '';
      const summary = stripHtml(item.description ?? item.content ?? '');
      return {
        id: toId(item.link ?? item.guid ?? title),
        title,
        summary,
        url: item.link ?? '',
        source,
        publishedAt: item.pubDate ?? '',
        category: detectCategory(title, summary),
        importance: detectImportance(title),
      };
    });
  } catch {
    return [];
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
    const allItems = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

    // deduplicate by URL
    const seen = new Set();
    const unique = allItems.filter((item) => {
      if (!item.url || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    const filtered = categoryId
      ? unique.filter((item) => item.category === categoryId)
      : unique;

    // sort: 高 first, then by publishedAt desc
    const importanceOrder = { '高': 0, '中': 1, '低': 2 };
    filtered.sort((a, b) => {
      const iDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
      if (iDiff !== 0) return iDiff;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    return new Response(JSON.stringify(filtered), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

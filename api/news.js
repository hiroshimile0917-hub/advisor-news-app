export const config = { runtime: 'edge' };

const RSS_FEEDS = [
  { url: 'https://www.boj.or.jp/rss/whatsnew.xml',                source: '日本銀行' },
  { url: 'https://www.nhk.or.jp/rss/news/cat6.xml',               source: 'NHK経済' },
  { url: 'https://toyokeizai.net/list/feed/rss',                  source: '東洋経済オンライン' },
  { url: 'https://diamond.jp/list/feed/rss/all',                  source: 'ダイヤモンド' },
  { url: 'https://www.asahi.com/rss/asahi/business.rdf',          source: '朝日新聞ビジネス' },
  { url: 'https://zuuonline.com/feed',                            source: 'ZUU online' },
];

const RSS2JSON = 'https://api.rss2json.com/v1/api.json';

// Order matters: more specific categories should appear before broader ones
// (e.g. corporate-ir before macro, regulation before macro).
const CATEGORIES = [
  {
    id: 'domestic-equity',
    keywords: [
      '日経平均', '日経225', '東証', 'TOPIX', 'JPX', '国内株', '日本株',
      'プライム市場', 'スタンダード市場', 'グロース市場', '東京市場', '銘柄',
      '上場', '銀行株', '商社株', '自動車株', '日銀', 'ETF買入',
    ],
  },
  {
    id: 'us-equity',
    keywords: [
      'NYSE', 'NASDAQ', 'ナスダック', 'S&P500', 'ダウ', '米国株', '米株',
      'マグニフィセント7', 'GAFAM', 'テスラ', 'エヌビディア', 'NVIDIA',
      'アップル', 'マイクロソフト', 'ウォール街', '米国市場', 'バフェット',
    ],
  },
  {
    id: 'bonds',
    keywords: [
      '国債', '利回り', 'Fed', 'FRB', '金利', '債券', '長期金利',
      '10年債', '日銀金融政策', '利上げ', '利下げ', 'YCC', 'イールドカーブ',
    ],
  },
  {
    id: 'forex',
    keywords: [
      '円安', '円高', 'ドル円', 'USD/JPY', 'FX', '為替', '通貨',
      'ユーロ', '人民元', '介入', '為替レート',
    ],
  },
  {
    id: 'fund-etf',
    keywords: [
      '投資信託', 'ETF', 'ファンド', 'つみたてNISA', '純資産',
      '運用会社', 'インデックスファンド', 'アクティブファンド', 'REIT',
    ],
  },
  {
    id: 'corporate-ir',
    keywords: [
      '決算', '業績', '配当', 'IR', '株主', '通期', '四半期',
      '増配', '減配', '自社株買い', '上方修正', '下方修正', '中間配当',
    ],
  },
  {
    id: 'regulation',
    keywords: [
      '金融庁', '規制', 'NISA', 'iDeCo', '制度改正', '法律', 'コーポレートガバナンス',
      '東証ルール', 'インサイダー', '法改正',
    ],
  },
  {
    id: 'macro',
    keywords: [
      'GDP', 'CPI', 'インフレ', 'デフレ', '景気', 'マクロ', '物価',
      '金融政策', '金融政策決定会合', '雇用統計', '失業率', '消費者物価指数',
      '経済指標', '景気動向',
    ],
  },
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

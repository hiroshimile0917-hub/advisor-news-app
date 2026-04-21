import { useState, useEffect, useCallback, useRef } from 'react';

const MOCK_ARTICLES = [
  { id: '1', title: '日経平均が年初来高値を更新、半導体株が牽引', summary: '東京株式市場で日経平均株価が大幅上昇し、年初来高値を更新した。', url: '#', source: 'モック', categoryId: 'domestic-equity', category: 'domestic-equity', publishedAt: '2026-04-21 09:30', importance: '高' },
  { id: '2', title: 'FRB、利下げ見送りを示唆 — 米CPI高止まりで', summary: '米連邦準備理事会（FRB）は声明で、インフレ指標の高止まりを受け利下げを当面見送る姿勢を示した。', url: '#', source: 'モック', categoryId: 'bonds', category: 'bonds', publishedAt: '2026-04-21 08:00', importance: '高' },
  { id: '3', title: 'ドル円153円台に下落、日銀政策修正観測が浮上', summary: '外国為替市場でドル円は153円台前半に下落。', url: '#', source: 'モック', categoryId: 'forex', category: 'forex', publishedAt: '2026-04-21 07:45', importance: '高' },
  { id: '4', title: 'S&P500、IT大手決算好調で最高値に迫る', summary: 'ニューヨーク株式市場でS&P500種指数は上昇。', url: '#', source: 'モック', categoryId: 'us-equity', category: 'us-equity', publishedAt: '2026-04-20 23:00', importance: '中' },
  { id: '5', title: '新NISA、口座開設数が1000万件突破', summary: '2024年から始まった新NISAの口座数が累計1000万件を超えた。', url: '#', source: 'モック', categoryId: 'regulation', category: 'regulation', publishedAt: '2026-04-20 18:00', importance: '中' },
  { id: '6', title: 'ビットコイン、70,000ドル台を回復', summary: '暗号資産市場でビットコインが70,000ドル台を回復。', url: '#', source: 'モック', categoryId: 'crypto', category: 'crypto', publishedAt: '2026-04-20 15:00', importance: '低' },
  { id: '7', title: 'トヨタ、通期業績予想を上方修正', summary: 'トヨタ自動車は2026年3月期の連結営業利益予想を上方修正。', url: '#', source: 'モック', categoryId: 'corporate-ir', category: 'corporate-ir', publishedAt: '2026-04-20 14:30', importance: '中' },
  { id: '8', title: '欧州株、ECB利下げ期待で続伸', summary: 'ユーロ圏のインフレ率が予想を下回り欧州株式市場は続伸。', url: '#', source: 'モック', categoryId: 'eu-equity', category: 'eu-equity', publishedAt: '2026-04-20 20:00', importance: '低' },
  { id: '9', title: '金融庁、暗号資産規制の強化方針を発表', summary: '金融庁は暗号資産交換業者に対する監督強化の方針を示した。', url: '#', source: 'モック', categoryId: 'regulation', category: 'regulation', publishedAt: '2026-04-20 12:00', importance: '高' },
  { id: '10', title: '日銀、金融政策決定会合を開催', summary: '日本銀行は金融政策決定会合を開催し、政策金利を据え置いた。', url: '#', source: 'モック', categoryId: 'macro', category: 'macro', publishedAt: '2026-04-20 10:00', importance: '高' },
];

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchFromApi(categoryId) {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  const res = await fetch(`/api/news?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = await res.json();
  return items.map((item) => ({ ...item, categoryId: item.category ?? item.categoryId }));
}

export function useNews({ categoryId = null, limit = null } = {}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchFromApi(categoryId);
      const result = limit ? items.slice(0, limit) : items;
      setArticles(result);
    } catch {
      let result = MOCK_ARTICLES;
      if (categoryId) result = result.filter((a) => a.categoryId === categoryId);
      if (limit) result = result.slice(0, limit);
      setArticles(result);
      setError('データを取得できませんでした（モック表示中）');
    } finally {
      setLoading(false);
    }
  }, [categoryId, limit, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [load]);

  const retry = () => setRetryCount((n) => n + 1);

  return { articles, loading, error, retry };
}

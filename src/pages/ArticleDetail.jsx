import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCategoryById } from '../utils/categories';
import { useFavorites } from '../hooks/useFavorites';

const IMPORTANCE_COLOR = {
  '高': 'bg-red-500/20 text-red-400 border border-red-500/40',
  '中': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  '低': 'bg-gray-500/20 text-gray-400 border border-gray-500/40',
};

function timeFormat(dateStr) {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function ArticleDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite, setMemo, getMemo } = useFavorites();

  // article passed via router state (from NewsCard click) — no extra fetch needed
  const article = state?.article ?? null;
  const [memo, setLocalMemo] = useState(() => (article ? getMemo(article.id) : ''));
  const [memoSaved, setMemoSaved] = useState(false);

  const category = article ? getCategoryById(article.categoryId ?? article.category) : null;
  const fav = article ? isFavorite(article.id) : false;

  const saveMemo = () => {
    if (!article) return;
    setMemo(article.id, memo);
    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 2000);
  };

  // sync memo from storage when article loads
  useEffect(() => {
    if (article) setLocalMemo(getMemo(article.id));
  }, [article?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!article) {
    return (
      <div className="px-4 py-8 text-center space-y-4">
        <p className="text-gray-500 text-sm">記事が見つかりません。</p>
        <button onClick={() => navigate(-1)} className="text-blue-400 text-sm hover:underline">
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        <button
          onClick={() => toggleFavorite(article.id)}
          className={`p-2 rounded-xl transition-colors ${fav ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-yellow-400'}`}
          aria-label="お気に入り"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={fav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {category && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${category.color}`}>
            {category.label}
          </span>
        )}
        {article.importance && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${IMPORTANCE_COLOR[article.importance] ?? IMPORTANCE_COLOR['低']}`}>
            重要度：{article.importance}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-base font-bold text-gray-100 leading-snug">{article.title}</h1>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {article.source && <span>{article.source}</span>}
        {article.publishedAt && (
          <>
            <span>·</span>
            <span>{timeFormat(article.publishedAt)}</span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#21262d]" />

      {/* Summary */}
      {article.summary && (
        <p className="text-sm text-gray-300 leading-relaxed">{article.summary}</p>
      )}

      {/* External link */}
      {article.url && article.url !== '#' && (
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          元記事を読む
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {/* Memo */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">メモ</h2>
        <textarea
          value={memo}
          onChange={(e) => { setLocalMemo(e.target.value); setMemoSaved(false); }}
          placeholder="この記事についてのメモを入力..."
          rows={4}
          className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          onClick={saveMemo}
          className="w-full py-2.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 text-sm font-medium rounded-xl transition-colors"
        >
          {memoSaved ? '保存しました ✓' : 'メモを保存'}
        </button>
      </section>
    </div>
  );
}

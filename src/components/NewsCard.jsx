import { useNavigate } from 'react-router-dom';
import { getCategoryById } from '../utils/categories';

const IMPORTANCE_BADGE = {
  '高': 'bg-red-500/20 text-red-400 border border-red-500/40',
  '中': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  '低': 'bg-gray-500/20 text-gray-400 border border-gray-500/40',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function NewsCard({ article, isRead = false, isWatched = false, onRead }) {
  const navigate = useNavigate();
  const category = getCategoryById(article.categoryId ?? article.category);

  const handleClick = () => {
    onRead?.(article.id);
    navigate(`/news/${article.id}`, { state: { article } });
  };

  return (
    <button
      onClick={handleClick}
      className={[
        'w-full text-left bg-[#161b22] rounded-xl p-4 transition-all',
        'hover:bg-[#1c2128] active:scale-[0.98]',
        isWatched ? 'border-l-4 border-l-yellow-400 pl-3' : 'border border-[#30363d]',
        isRead ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {category && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${category.color}`}>
            {category.label}
          </span>
        )}
        {article.importance && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${IMPORTANCE_BADGE[article.importance] ?? IMPORTANCE_BADGE['低']}`}>
            {article.importance}
          </span>
        )}
        {isRead && (
          <span className="text-[10px] text-gray-600">既読</span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2">
        {article.title}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[11px] text-gray-500">{article.source}</span>
        <span className="text-[11px] text-gray-600">·</span>
        <span className="text-[11px] text-gray-500">{timeAgo(article.publishedAt)}</span>
      </div>
    </button>
  );
}

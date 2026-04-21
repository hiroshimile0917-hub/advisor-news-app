import { useState } from 'react';
import MarketTicker from '../components/MarketTicker';
import NewsCard from '../components/NewsCard';
import CategoryFilter from '../components/CategoryFilter';
import SkeletonCard from '../components/SkeletonCard';
import { useNews } from '../hooks/useNews';
import { useWatchList } from '../hooks/useWatchList';
import { useReadState } from '../hooks/useReadState';

function DailyBriefing({ articles }) {
  const urgent = articles.filter((a) => a.importance === '高').slice(0, 5);
  if (urgent.length === 0) return null;

  return (
    <section className="mx-4">
      <div className="bg-gradient-to-br from-red-950/60 to-orange-950/40 border border-red-800/40 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider">本日の重要ニュース</h2>
        </div>
        <ul className="space-y-2.5">
          {urgent.map((a) => (
            <li key={a.id} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <a
                href={a.url !== '#' ? a.url : undefined}
                target={a.url !== '#' ? '_blank' : undefined}
                rel="noreferrer"
                className="text-sm text-gray-200 hover:text-white leading-snug line-clamp-2"
              >
                {a.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { articles, loading, error, retry } = useNews({ categoryId: selectedCategory });
  const { watchList } = useWatchList();
  const { markRead, isRead } = useReadState();

  return (
    <div className="space-y-4 py-4">
      {/* Market Ticker */}
      <MarketTicker />

      {/* Daily Briefing — always shown from full articles if available */}
      {!loading && <DailyBriefing articles={articles} />}

      {/* Category Filter */}
      <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />

      {/* Error banner */}
      {error && (
        <div className="mx-4 flex items-center justify-between bg-yellow-900/30 border border-yellow-700/40 rounded-xl px-4 py-2.5">
          <p className="text-xs text-yellow-400">{error}</p>
          <button
            onClick={retry}
            className="text-xs text-yellow-300 underline ml-3 flex-shrink-0"
          >
            再試行
          </button>
        </div>
      )}

      {/* News list */}
      <section className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            このカテゴリの記事はありません
          </div>
        ) : (
          articles.map((a) => (
            <NewsCard
              key={a.id}
              article={a}
              isRead={isRead(a.id)}
              isWatched={watchList.includes(a.id)}
              onRead={markRead}
            />
          ))
        )}
      </section>
    </div>
  );
}

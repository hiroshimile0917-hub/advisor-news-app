import { useState } from 'react';
import NewsCard from '../components/NewsCard';
import CategoryFilter from '../components/CategoryFilter';
import { useNews } from '../hooks/useNews';

export default function NewsList() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { articles, loading } = useNews({ categoryId: selectedCategory });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">ニュース一覧</h1>
      <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
      {loading ? (
        <p className="text-gray-500 text-sm">読み込み中...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a) => <NewsCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}

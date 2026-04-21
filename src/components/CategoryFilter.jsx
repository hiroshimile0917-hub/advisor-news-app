import { useRef } from 'react';
import { CATEGORIES } from '../utils/categories';

export default function CategoryFilter({ selected, onChange }) {
  const scrollRef = useRef(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none"
    >
      {[{ id: null, label: 'すべて' }, ...CATEGORIES].map((cat) => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id ?? 'all'}
            onClick={() => onChange(cat.id)}
            className={[
              'flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-all',
              isActive
                ? 'bg-blue-500 text-white'
                : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:border-blue-500/50 hover:text-gray-200',
            ].join(' ')}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

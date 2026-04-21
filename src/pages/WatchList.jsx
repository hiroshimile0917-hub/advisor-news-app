import { useState } from 'react';
import { useWatchList } from '../hooks/useWatchList';
import { CATEGORIES } from '../utils/categories';

function Toggle({ on, onToggle }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-blue-500' : 'bg-[#30363d]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function WatchList() {
  const {
    keywords, watchedCategories,
    addKeyword, removeKeyword,
    toggleCategory, isCategoryWatched,
    isFull, count,
  } = useWatchList();

  const [input, setInput] = useState('');
  const [warn, setWarn] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isFull) { setWarn('登録上限（100件）に達しています'); return; }
    if (keywords.includes(trimmed)) { setWarn('すでに登録済みです'); return; }
    addKeyword(trimmed);
    setInput('');
    setWarn('');
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleAdd(); };

  return (
    <div className="py-4 px-4 space-y-6">
      <h1 className="text-lg font-bold text-gray-100">ウォッチリスト</h1>

      {/* Input */}
      <section className="space-y-2">
        <p className="text-xs text-gray-500">銘柄コード（例: 7203.T）またはキーワードを登録</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setWarn(''); }}
            onKeyDown={handleKey}
            placeholder="トヨタ / 7203.T / 半導体 ..."
            className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={isFull}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#21262d] disabled:text-gray-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            追加
          </button>
        </div>
        {warn && <p className="text-xs text-yellow-400">{warn}</p>}
        <p className="text-xs text-gray-600">{count} / 100 件登録済み</p>
      </section>

      {/* Registered keywords */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">登録済みキーワード</h2>
        {keywords.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">登録されていません</p>
        ) : (
          <ul className="space-y-2">
            {keywords.map((kw) => (
              <li key={kw} className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
                <span className="text-sm text-gray-200 font-mono">{kw}</span>
                <button
                  onClick={() => removeKeyword(kw)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  aria-label="削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Category watch */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">カテゴリ別ウォッチ</h2>
        <ul className="space-y-2">
          {CATEGORIES.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
              </div>
              <Toggle on={isCategoryWatched(cat.id)} onToggle={() => toggleCategory(cat.id)} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-gray-600 pb-4">
        ※ 顧客情報・保有銘柄は含みません。ニュース配信専用です。
      </p>
    </div>
  );
}

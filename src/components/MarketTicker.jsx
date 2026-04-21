import { useState, useEffect, useRef } from 'react';

const FALLBACK = [
  { label: '日経225',  value: '--', change: '--', up: true },
  { label: 'TOPIX',    value: '--', change: '--', up: true },
  { label: 'USD/JPY',  value: '--', change: '--', up: true },
  { label: 'S&P500',   value: '--', change: '--', up: true },
  { label: '米10年債', value: '--', change: '--', up: true },
];

const REFRESH_MS = 60 * 1000;

export default function MarketTicker() {
  const [tickers, setTickers] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/market');
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTickers(data);
      }
    } catch {
      // keep previous values on error — no flash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-none">
      {tickers.map((t) => (
        <div
          key={t.label}
          className={`flex-shrink-0 flex flex-col items-center bg-[#161b22] rounded-xl px-4 py-2.5 min-w-[90px] transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}
        >
          <span className="text-[10px] text-gray-500 mb-1">{t.label}</span>
          <span className="text-sm font-bold text-gray-100 tabular-nums">{t.value}</span>
          <span className={`text-[10px] font-semibold mt-0.5 tabular-nums ${
            t.change === '--' ? 'text-gray-600' : t.up ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {t.change}
          </span>
        </div>
      ))}
    </div>
  );
}

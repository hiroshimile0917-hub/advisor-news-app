const TICKERS = [
  { label: '日経225', value: '38,450', change: '+1.24%', up: true },
  { label: 'TOPIX', value: '2,712', change: '+0.98%', up: true },
  { label: 'USD/JPY', value: '153.40', change: '-0.32%', up: false },
  { label: 'S&P500', value: '5,234', change: '+0.76%', up: true },
  { label: '米10年債', value: '4.32%', change: '+0.05', up: false },
];

export default function MarketTicker() {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-none">
      {TICKERS.map((t) => (
        <div
          key={t.label}
          className="flex-shrink-0 flex flex-col items-center bg-[#161b22] rounded-xl px-4 py-2.5 min-w-[90px]"
        >
          <span className="text-[10px] text-gray-500 mb-1">{t.label}</span>
          <span className="text-sm font-bold text-gray-100">{t.value}</span>
          <span className={`text-[10px] font-semibold mt-0.5 ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {t.change}
          </span>
        </div>
      ))}
    </div>
  );
}

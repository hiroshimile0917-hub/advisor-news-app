export const CATEGORIES = [
  {
    id: 'domestic-equity',
    label: '国内株式',
    color: 'bg-red-100 text-red-800',
    keywords: ['日経', '東証', 'JPX', '国内株', 'TOPIX'],
  },
  {
    id: 'us-equity',
    label: '外国株式（米国）',
    color: 'bg-blue-100 text-blue-800',
    keywords: ['NYSE', 'NASDAQ', 'S&P500', 'ダウ', '米国株'],
  },
  {
    id: 'eu-equity',
    label: '外国株式（欧州）',
    color: 'bg-indigo-100 text-indigo-800',
    keywords: ['DAX', 'FTSE', 'ユーロストックス', '欧州株'],
  },
  {
    id: 'em-equity',
    label: '外国株式（新興国）',
    color: 'bg-green-100 text-green-800',
    keywords: ['新興国', '中国株', 'インド株', 'MSCI EM'],
  },
  {
    id: 'bonds',
    label: '金利・債券',
    color: 'bg-yellow-100 text-yellow-800',
    keywords: ['国債', '利回り', 'Fed', '金利', '債券'],
  },
  {
    id: 'forex',
    label: '為替',
    color: 'bg-orange-100 text-orange-800',
    keywords: ['円安', '円高', 'ドル円', 'FX', '為替'],
  },
  {
    id: 'fund-etf',
    label: '投資信託・ETF',
    color: 'bg-purple-100 text-purple-800',
    keywords: ['投資信託', 'ETF', 'ファンド', 'つみたてNISA'],
  },
  {
    id: 'regulation',
    label: '規制・制度改正',
    color: 'bg-pink-100 text-pink-800',
    keywords: ['金融庁', '規制', 'NISA', 'iDeCo', '制度改正'],
  },
  {
    id: 'macro',
    label: 'マクロ経済',
    color: 'bg-teal-100 text-teal-800',
    keywords: ['GDP', 'CPI', 'インフレ', '景気', 'マクロ'],
  },
  {
    id: 'corporate-ir',
    label: '企業IR',
    color: 'bg-cyan-100 text-cyan-800',
    keywords: ['決算', '業績', '配当', 'IR', '株主'],
  },
  {
    id: 'crypto',
    label: '仮想通貨',
    color: 'bg-gray-100 text-gray-800',
    keywords: ['ビットコイン', '暗号資産', 'イーサリアム', 'crypto', 'BTC'],
  },
];

export const getCategoryById = (id) => CATEGORIES.find((c) => c.id === id);

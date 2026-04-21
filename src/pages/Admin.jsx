import { useNews } from '../hooks/useNews';

export default function Admin() {
  const { articles } = useNews({});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">管理画面</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '総記事数', value: articles.length },
          { label: 'カテゴリ数', value: 11 },
          { label: '登録ユーザー', value: '—' },
          { label: 'API呼び出し/日', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">記事一覧</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-2 text-xs font-medium text-gray-600">ID</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-600">タイトル</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-600">カテゴリ</th>
              <th className="px-3 py-2 text-xs font-medium text-gray-600">日時</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500 font-mono text-xs">{a.id}</td>
                <td className="px-3 py-2 text-gray-900">{a.title}</td>
                <td className="px-3 py-2 text-gray-500">{a.categoryId}</td>
                <td className="px-3 py-2 text-gray-400 text-xs">{a.publishedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

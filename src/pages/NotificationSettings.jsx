import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { CATEGORIES } from '../utils/categories';

const IMPORTANCE_LEVELS = [
  { key: '高', label: '重要度：高', color: 'text-red-400' },
  { key: '中', label: '重要度：中', color: 'text-yellow-400' },
  { key: '低', label: '重要度：低', color: 'text-gray-400' },
];

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

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">{children}</h2>
  );
}

export default function NotificationSettings() {
  const { settings, update, toggleCategory, toggleImportance, requestPermission, sendTest } =
    useNotificationSettings();

  const permissionLabel = {
    granted: '許可済み',
    denied: '拒否済み（ブラウザ設定から変更してください）',
    default: '未設定',
    unsupported: '非対応ブラウザ',
  }[settings.permission] ?? '未設定';

  const permissionColor = {
    granted: 'text-emerald-400',
    denied: 'text-red-400',
  }[settings.permission] ?? 'text-gray-400';

  return (
    <div className="py-4 px-4 space-y-6">
      <h1 className="text-lg font-bold text-gray-100">通知設定</h1>

      {/* Permission */}
      <section className="space-y-3">
        <SectionTitle>ブラウザ通知</SectionTitle>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">通知の状態</span>
            <span className={`text-xs font-medium ${permissionColor}`}>{permissionLabel}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              disabled={settings.permission === 'granted' || settings.permission === 'denied'}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#21262d] disabled:text-gray-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              通知を許可する
            </button>
            <button
              onClick={sendTest}
              disabled={settings.permission !== 'granted'}
              className="flex-1 py-2.5 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 text-gray-300 text-sm font-medium rounded-xl transition-colors"
            >
              テスト送信
            </button>
          </div>
        </div>
      </section>

      {/* Importance */}
      <section className="space-y-2">
        <SectionTitle>重要度別通知</SectionTitle>
        <ul className="space-y-2">
          {IMPORTANCE_LEVELS.map(({ key, label, color }) => (
            <li key={key} className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
              <span className={`text-sm font-medium ${color}`}>{label}</span>
              <Toggle
                on={!!settings.importance[key]}
                onToggle={() => toggleImportance(key)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section className="space-y-2">
        <SectionTitle>カテゴリ別通知</SectionTitle>
        <ul className="space-y-2">
          {CATEGORIES.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
              <Toggle
                on={!!settings.categories[cat.id]}
                onToggle={() => toggleCategory(cat.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Quiet hours */}
      <section className="space-y-2">
        <SectionTitle>静粛時間帯</SectionTitle>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-4 space-y-3">
          <p className="text-xs text-gray-500">設定した時間帯は通知を送信しません（空欄 = 常時通知）</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-gray-500">開始</label>
              <input
                type="time"
                value={settings.quietStart}
                onChange={(e) => update({ quietStart: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-gray-600 mt-4">〜</span>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-gray-500">終了</label>
              <input
                type="time"
                value={settings.quietEnd}
                onChange={(e) => update({ quietEnd: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {(settings.quietStart || settings.quietEnd) && (
            <button
              onClick={() => update({ quietStart: '', quietEnd: '' })}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              クリア
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

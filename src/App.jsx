import { useState, useEffect, useRef } from "react";

// ─── DATA ───────────────────────────────────────────────
const NEWS = [
  { id: 1, category: "決算", impact: "high", time: "10:15", ticker: "TSE:7203",
    title: "トヨタ自動車、通期営業利益を上方修正——円安効果と北米販売好調",
    summary: "トヨタ自動車（7203）は2025年3月期の通期営業利益予想を4.5兆円から5.0兆円へ上方修正した。円安効果に加え、北米でのHV販売が想定を上回る伸びを示した。アドバイザーとして顧客への影響を確認しておきたい。",
    tags: ["トヨタ", "自動車", "決算"] },
  { id: 2, category: "金融政策", impact: "high", time: "09:00", ticker: "TVC:JGB10Y",
    title: "日銀、追加利上げ見送り——植田総裁「物価目標の持続性を見極める」",
    summary: "日本銀行は本日の金融政策決定会合で政策金利を0.5%に据え置いた。植田総裁は会見で、物価目標2%の持続的達成に向けて慎重に判断する姿勢を改めて示した。",
    tags: ["日銀", "金利", "金融政策"] },
  { id: 3, category: "マーケット", impact: "medium", time: "08:45", ticker: "SPREADEX:JPN225",
    title: "日経平均、3日続伸——半導体関連に買い、38,500円台回復",
    summary: "東京株式市場で日経平均株価は3日続伸。米フィラデルフィア半導体指数の上昇を好感し、東京エレクトロンやアドバンテストなど半導体関連株に買いが集まった。",
    tags: ["日経平均", "半導体", "株式"] },
  { id: 4, category: "新NISA", impact: "medium", time: "08:00", ticker: "TSE:1306",
    title: "新NISA口座数、2,500万口座を突破——3月末時点・金融庁集計",
    summary: "金融庁の集計によると、新NISAの口座数が3月末時点で2,500万口座を超えた。特に30〜40代の積立投資需要が旺盛で、インデックスファンドへの流入が続いている。",
    tags: ["NISA", "投資信託", "個人投資家"] },
  { id: 5, category: "為替", impact: "medium", time: "07:30", ticker: "FX:USDJPY",
    title: "ドル円、148円台前半——FRB議事録でタカ派発言を確認",
    summary: "外国為替市場でドル円は148円台前半で推移。FOMCの議事録で複数の委員が利下げに慎重な姿勢を示したことが確認され、ドルが底堅く推移している。",
    tags: ["為替", "ドル円", "FRB"] },
  { id: 6, category: "不動産", impact: "low", time: "昨日", ticker: "TSE:8952",
    title: "J-REIT指数、小幅上昇——金利据え置きを好感",
    summary: "東証REIT指数は小幅上昇。日銀の利上げ見送りを受け、金利上昇懸念が後退した。物流・住居系REITに買いが入った。",
    tags: ["REIT", "不動産", "金利"] },
];

const WATCHLIST = [
  { symbol: "7203", name: "トヨタ自動車", price: "3,842", change: "+1.8%", up: true },
  { symbol: "6762", name: "TDK", price: "1,923", change: "+2.4%", up: true },
  { symbol: "8306", name: "三菱UFJ FG", price: "1,654", change: "+0.6%", up: true },
  { symbol: "7974", name: "任天堂", price: "8,120", change: "-0.3%", up: false },
  { symbol: "9984", name: "ソフトバンクG", price: "9,240", change: "+1.1%", up: true },
  { symbol: "6857", name: "アドバンテスト", price: "6,580", change: "+3.2%", up: true },
];

const CHART_SYMBOLS = [
  { label: "日経225", symbol: "SPREADEX:JPN225" },
  { label: "TOPIX", symbol: "TSE:TOPIX" },
  { label: "USD/JPY", symbol: "FX:USDJPY" },
  { label: "トヨタ", symbol: "TSE:7203" },
  { label: "三菱UFJ", symbol: "TSE:8306" },
  { label: "10年債", symbol: "TVC:JGB10Y" },
];

const CATEGORIES = ["すべて", "決算", "金融政策", "マーケット", "新NISA", "為替", "不動産"];

const PUSH_NOTIFICATIONS = [
  { id: "p1", title: "🔴 重要：日銀政策金利 据え置き決定", time: "09:02", read: false },
  { id: "p2", title: "📈 トヨタ決算：営業利益 上方修正", time: "10:16", read: false },
  { id: "p3", title: "💹 日経平均 38,500円台回復", time: "08:47", read: true },
];

const IMPACT = { high: "#C9A84C", medium: "#6B9FD4", low: "#7A8A9A" };
const IMPACT_LABEL = { high: "重要", medium: "注目", low: "参考" };

const SAVED_MEMO_INIT = [];

// ─── TRADINGVIEW WIDGET ──────────────────────────────────
function TVChart({ symbol, height = 260 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      symbol, interval: "D", width: "100%", height,
      theme: "dark", style: "1", locale: "ja",
      backgroundColor: "rgba(10,20,38,1)",
      gridColor: "rgba(201,168,76,0.07)",
      hide_top_toolbar: false, save_image: false,
    });
    ref.current.appendChild(s);
  }, [symbol]);
  return <div ref={ref} style={{ width: "100%", height, borderRadius: 12, overflow: "hidden" }} />;
}

// ─── MAIN APP ────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("news");
  const [category, setCategory] = useState("すべて");
  const [selected, setSelected] = useState(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chartSym, setChartSym] = useState("SPREADEX:JPN225");
  const [toast, setToast] = useState(null);
  const [memos, setMemos] = useState(SAVED_MEMO_INIT);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(PUSH_NOTIFICATIONS);
  const [showIncoming, setShowIncoming] = useState(false);
  const incomingShown = useRef(false);

  const unread = notifications.filter(n => !n.read).length;
  const filtered = category === "すべて" ? NEWS : NEWS.filter(n => n.category === category);

  // Simulate push notification after 4s
  useEffect(() => {
    if (incomingShown.current) return;
    const t = setTimeout(() => {
      setShowIncoming(true);
      incomingShown.current = true;
      setTimeout(() => setShowIncoming(false), 5000);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const openArticle = (article) => {
    setSelected(article);
    setAiText("");
    fetchAI(article);
  };

  const fetchAI = async (article) => {
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `あなたはIFA（独立系ファイナンシャルアドバイザー）向けの金融アナリストです。
ニュースを読み、以下の形式で日本語で分析してください：

**要点**
（核心を1〜2文で）

**顧客への影響**
（具体的な顧客層ごとの影響）

**提案アクション**
（今週できる具体的な提案を2つ）

簡潔・実用的に。マークダウン形式で。`,
          messages: [{ role: "user", content: `${article.title}\n\n${article.summary}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "分析できませんでした。";
      setAiText(text);
    } catch {
      setAiText("エラーが発生しました。");
    }
    setAiLoading(false);
  };

  const saveMemo = () => {
    if (!selected) return;
    setMemos(prev => [{ ...selected, aiText, savedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
    showToast("提案メモに保存しました");
    setSelected(null);
  };

  const md = (t) => t
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#C9A84C">$1</strong>')
    .replace(/\n/g, "<br/>");

  const S = {
    root: { fontFamily: "'Hiragino Mincho ProN','Yu Mincho',Georgia,serif", background: "#080F1C", minHeight: "100vh", color: "#EEE8DC", maxWidth: 430, margin: "0 auto", position: "relative" },
    header: { background: "rgba(8,15,28,0.97)", borderBottom: "1px solid rgba(201,168,76,0.18)", padding: "14px 18px 0", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(14px)" },
    tab: (active) => ({ flex: 1, border: "none", borderRadius: 8, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: "inherit", background: active ? "#C9A84C" : "rgba(255,255,255,0.05)", color: active ? "#080F1C" : "#6A7A8A", fontWeight: active ? "bold" : "normal" }),
    pill: (active) => ({ border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", background: active ? "#C9A84C" : "rgba(255,255,255,0.06)", color: active ? "#080F1C" : "#7A8A9A", fontWeight: active ? "bold" : "normal" }),
    card: (highlighted) => ({ background: "rgba(255,255,255,0.03)", border: `1px solid ${highlighted ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 15, marginBottom: 10, cursor: "pointer", position: "relative", overflow: "hidden" }),
    badge: (color) => ({ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: `${color}22`, color, fontWeight: "bold", letterSpacing: 1 }),
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(8,15,28,0.97)", borderTop: "1px solid rgba(201,168,76,0.15)", display: "flex", justifyContent: "space-around", padding: "10px 0 22px", backdropFilter: "blur(12px)", zIndex: 90 },
    drawer: { background: "#0D1E35", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "88vh", overflowY: "auto", padding: "22px 18px 40px", border: "1px solid rgba(201,168,76,0.2)", borderBottom: "none" },
  };

  return (
    <div style={S.root}>

      {/* ── Incoming Push Notification ── */}
      {showIncoming && (
        <div onClick={() => setShowIncoming(false)} style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#0D1E35", border: "1px solid rgba(201,168,76,0.4)",
          borderRadius: 14, padding: "12px 16px", width: 340, zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)", cursor: "pointer",
          animation: "slideDown 0.4s ease",
        }}>
          <style>{`@keyframes slideDown{from{transform:translateX(-50%) translateY(-80px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}`}</style>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ fontSize: 22 }}>🔔</div>
            <div>
              <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: 2, marginBottom: 3 }}>LG ASSET · Advisor Intelligence</div>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#EEE8DC" }}>🔴 速報：日銀 金利据え置き決定</div>
              <div style={{ fontSize: 11, color: "#8A9BAC", marginTop: 3 }}>アドバイザー向け分析を確認してください</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#C9A84C", color: "#080F1C", padding: "10px 22px", borderRadius: 40, fontSize: 13, fontWeight: "bold", zIndex: 9998, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 4 }}>LG ASSET</div>
            <div style={{ fontSize: 17, fontWeight: "bold", letterSpacing: 2 }}>Advisor Intelligence</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div onClick={() => setNotifOpen(true)} style={{ position: "relative", cursor: "pointer" }}>
              <div style={{ border: "1px solid rgba(201,168,76,0.5)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#C9A84C" }}>🔔 {unread}</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#7A5200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", color: "#080F1C" }}>H</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {[["news","ニュース"],["chart","チャート"],["watchlist","銘柄"],["memo","提案メモ"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={S.tab(tab===k)}>{l}{k==="memo"&&memos.length>0?` (${memos.length})`:""}</button>
          ))}
        </div>
      </div>

      {/* ══════════ NEWS ══════════ */}
      {tab === "news" && (
        <div style={{ padding: "0 14px 100px" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0", scrollbarWidth: "none" }}>
            {CATEGORIES.map(c => <button key={c} onClick={() => setCategory(c)} style={S.pill(category===c)}>{c}</button>)}
          </div>
          {filtered.map(a => (
            <div key={a.id} onClick={() => openArticle(a)} style={S.card([1,2].includes(a.id))}>
              {[1,2].includes(a.id) && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#C9A84C", borderRadius: "3px 0 0 3px" }} />}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={S.badge(IMPACT[a.impact])}>{IMPACT_LABEL[a.impact]}</span>
                  <span style={{ fontSize: 10, color: "#5A6A7A" }}>{a.category}</span>
                </div>
                <span style={{ fontSize: 10, color: "#4A5A6A" }}>{a.time}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: "bold", lineHeight: 1.5, color: "#EEE8DC", marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: "#7A8A9A", lineHeight: 1.6 }}>{a.summary.slice(0, 58)}...</div>
              <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                {a.tags.map(t => <span key={t} style={{ fontSize: 9, color: "#5A7A9A", background: "rgba(90,122,154,0.12)", padding: "2px 8px", borderRadius: 10 }}>#{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════ CHART ══════════ */}
      {tab === "chart" && (
        <div style={{ padding: "14px 14px 100px" }}>
          <div style={{ fontSize: 11, color: "#6A7A8A", marginBottom: 10 }}>銘柄・指数を選択</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {CHART_SYMBOLS.map(s => <button key={s.symbol} onClick={() => setChartSym(s.symbol)} style={S.pill(chartSym===s.symbol)}>{s.label}</button>)}
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(201,168,76,0.15)" }}>
            <TVChart symbol={chartSym} />
          </div>
          <div style={{ marginTop: 12, background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 12, padding: 12, fontSize: 11, color: "#6A7A8A", lineHeight: 1.7 }}>
            ※ TradingViewウィジェットを使用。チャートは現在の契約プランのデータを表示します。
          </div>
        </div>
      )}

      {/* ══════════ WATCHLIST ══════════ */}
      {tab === "watchlist" && (
        <div style={{ padding: "14px 14px 100px" }}>
          <div style={{ fontSize: 11, color: "#6A7A8A", marginBottom: 12 }}>ウォッチリスト — タップでチャート表示</div>
          {WATCHLIST.map(s => (
            <div key={s.symbol} onClick={() => { setChartSym(`TSE:${s.symbol}`); setTab("chart"); }} style={{ ...S.card(false), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#EEE8DC" }}>{s.name}</div>
                <div style={{ fontSize: 10, color: "#4A5A6A", marginTop: 2 }}>{s.symbol} · 東証プライム</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: "bold", color: "#EEE8DC" }}>¥{s.price}</div>
                <div style={{ fontSize: 12, color: s.up ? "#4CAF84" : "#E05C5C", marginTop: 2 }}>{s.change}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 12, padding: 12, fontSize: 11, color: "#6A7A8A", lineHeight: 1.7 }}>
            ※ 価格はデモデータ。本番時はJ-Quants API（東証）またはTradingView Data APIと連携します。
          </div>
        </div>
      )}

      {/* ══════════ MEMO ══════════ */}
      {tab === "memo" && (
        <div style={{ padding: "14px 14px 100px" }}>
          <div style={{ fontSize: 11, color: "#6A7A8A", marginBottom: 12 }}>保存した提案メモ</div>
          {memos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#3A4A5A", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              ニュース詳細画面から<br />「提案メモに保存」してください
            </div>
          ) : memos.map((m, i) => (
            <div key={i} style={S.card(false)}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={S.badge(IMPACT[m.impact])}>{IMPACT_LABEL[m.impact]}</span>
                <span style={{ fontSize: 10, color: "#4A5A6A" }}>保存 {m.savedAt}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#EEE8DC", lineHeight: 1.5, marginBottom: 10 }}>{m.title}</div>
              {m.aiText && (
                <div style={{ fontSize: 11, color: "#9AAABB", lineHeight: 1.8, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}
                  dangerouslySetInnerHTML={{ __html: md(m.aiText.slice(0, 200) + "...") }} />
              )}
              <button onClick={() => { setMemos(prev => prev.filter((_, j) => j !== i)); showToast("削除しました"); }} style={{ marginTop: 12, background: "rgba(224,92,92,0.12)", border: "1px solid rgba(224,92,92,0.3)", borderRadius: 8, padding: "6px 14px", fontSize: 11, color: "#E05C5C", cursor: "pointer", fontFamily: "inherit" }}>削除</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={S.bottomNav}>
        {[["news","📰","ニュース"],["chart","📈","チャート"],["watchlist","⭐","銘柄"],["memo","📋","メモ"]].map(([k,ic,l]) => (
          <div key={k} onClick={() => setTab(k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab===k ? "#C9A84C" : "#3A4A5A", fontSize: 9, cursor: "pointer", letterSpacing: 0.5 }}>
            <span style={{ fontSize: 22 }}>{ic}</span>{l}
          </div>
        ))}
      </div>

      {/* ── Notification Drawer ── */}
      {notifOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,8,16,0.88)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" }} onClick={() => setNotifOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={S.drawer}>
            <div style={{ width: 36, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 18px" }} />
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#C9A84C", marginBottom: 14, letterSpacing: 1 }}>通知</div>
            {notifications.map(n => (
              <div key={n.id} onClick={() => setNotifications(prev => prev.map(x => x.id===n.id ? {...x, read:true} : x))}
                style={{ background: n.read ? "rgba(255,255,255,0.02)" : "rgba(201,168,76,0.07)", border: `1px solid ${n.read ? "rgba(255,255,255,0.06)" : "rgba(201,168,76,0.25)"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: n.read ? "#6A7A8A" : "#EEE8DC", fontWeight: n.read ? "normal" : "bold" }}>{n.title}</div>
                  {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C", flexShrink: 0, marginLeft: 8 }} />}
                </div>
                <div style={{ fontSize: 10, color: "#4A5A6A", marginTop: 4 }}>{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Article Drawer ── */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,8,16,0.88)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={S.drawer}>
            <div style={{ width: 36, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 18px" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <span style={S.badge(IMPACT[selected.impact])}>{IMPACT_LABEL[selected.impact]}</span>
              <span style={{ fontSize: 10, color: "#6A7A8A" }}>{selected.category} · {selected.time}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: "bold", lineHeight: 1.6, color: "#EEE8DC", marginBottom: 12 }}>{selected.title}</h2>
            <p style={{ fontSize: 13, color: "#9AAABB", lineHeight: 1.8, marginBottom: 16 }}>{selected.summary}</p>

            {/* Chart */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(201,168,76,0.15)", marginBottom: 16 }}>
              <TVChart symbol={selected.ticker} height={220} />
            </div>

            {/* AI */}
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: "bold", letterSpacing: 2, marginBottom: 10 }}>✦ AI アドバイザー分析</div>
              {aiLoading
                ? <div style={{ color: "#6A7A8A", fontSize: 12 }}>分析中...</div>
                : <div style={{ fontSize: 12, color: "#C8D4E0", lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: md(aiText) }} />}
            </div>

            <button onClick={saveMemo} style={{ width: "100%", background: "linear-gradient(135deg,#C9A84C,#8B6810)", color: "#080F1C", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>
              📋 提案メモに保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
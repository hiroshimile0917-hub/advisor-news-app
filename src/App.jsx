import { useState, useEffect, useRef } from "react";

const IMPACT = { high: "#C9A84C", medium: "#6B9FD4", low: "#7A8A9A" };
const IMPACT_LABEL = { high: "重要", medium: "注目", low: "参考" };
const CATEGORIES = ["すべて", "マーケット", "決算", "金融政策", "為替", "新NISA", "不動産"];
const RSS_FEEDS = [
  { id: "st", label: "株式" },
  { id: "fx", label: "為替" },
  { id: "mk", label: "マーケット" },
];

function detectImpact(title) {
  const high = ["日銀", "利上げ", "利下げ", "決算", "上方修正", "下方修正", "速報"];
  const medium = ["日経平均", "株価", "為替", "円安", "円高", "NISA", "金利"];
  if (high.some(function(k) { return title.includes(k); })) return "high";
  if (medium.some(function(k) { return title.includes(k); })) return "medium";
  return "low";
}

function detectCategory(title) {
  if (["決算", "上方修正", "下方修正"].some(function(k) { return title.includes(k); })) return "決算";
  if (["日銀", "金利", "利上げ", "利下げ"].some(function(k) { return title.includes(k); })) return "金融政策";
  if (["NISA", "投資信託"].some(function(k) { return title.includes(k); })) return "新NISA";
  if (["ドル", "円安", "円高", "為替"].some(function(k) { return title.includes(k); })) return "為替";
  if (["REIT", "不動産"].some(function(k) { return title.includes(k); })) return "不動産";
  return "マーケット";
}

function parseRSS(xmlText) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, "text/xml");
  var items = Array.from(doc.querySelectorAll("item"));
  return items.slice(0, 10).map(function(item, i) {
    var title = (item.querySelector("title") || {}).textContent || "";
    var desc = ((item.querySelector("description") || {}).textContent || "").replace(/<[^>]*>/g, "");
    var link = (item.querySelector("link") || {}).textContent || "";
    var pubDate = (item.querySelector("pubDate") || {}).textContent || "";
    var date = pubDate ? new Date(pubDate) : new Date();
    var h = date.getHours().toString().padStart(2, "0");
    var m = date.getMinutes().toString().padStart(2, "0");
    return {
      id: "rss-" + i + "-" + Date.now(),
      title: title.trim(),
      summary: (desc || title).trim(),
      link: link.trim(),
      time: h + ":" + m,
      impact: detectImpact(title),
      category: detectCategory(title),
    };
  });
}

export default function App() {
  var tabState = useState("news");
  var tab = tabState[0]; var setTab = tabState[1];
  var catState = useState("すべて");
  var category = catState[0]; var setCategory = catState[1];
  var feedState = useState("st");
  var activeFeed = feedState[0]; var setActiveFeed = feedState[1];
  var newsState = useState([]);
  var news = newsState[0]; var setNews = newsState[1];
  var loadState = useState(true);
  var loading = loadState[0]; var setLoading = loadState[1];
  var errState = useState(null);
  var error = errState[0]; var setError = errState[1];
  var selectedState = useState(null);
  var selected = selectedState[0]; var setSelected = selectedState[1];
  var aiState = useState("");
  var aiText = aiState[0]; var setAiText = aiState[1];
  var aiLoadState = useState(false);
  var aiLoading = aiLoadState[0]; var setAiLoading = aiLoadState[1];
  var toastState = useState(null);
  var toast = toastState[0]; var setToast = toastState[1];
  var memosState = useState([]);
  var memos = memosState[0]; var setMemos = memosState[1];
  var updatedState = useState(null);
  var lastUpdated = updatedState[0]; var setLastUpdated = updatedState[1];

  var filtered = category === "すべて" ? news : news.filter(function(n) { return n.category === category; });

  function showToast(msg) {
    setToast(msg);
    setTimeout(function() { setToast(null); }, 3000);
  }

  function fetchNews(feedId) {
    setLoading(true);
    setError(null);
    fetch("/api/news?feed=" + (feedId || activeFeed))
      .then(function(res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function(text) {
        var items = parseRSS(text);
        if (items.length === 0) throw new Error("記事なし");
        setNews(items);
        var now = new Date();
        setLastUpdated(now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0"));
        setLoading(false);
      })
      .catch(function(e) {
        setError("取得に失敗しました");
        setLoading(false);
      });
  }

  useEffect(function() { fetchNews(activeFeed); }, [activeFeed]);

  function openArticle(article) {
    setSelected(article);
    setAiText("");
    setAiLoading(true);
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "あなたはIFA向けの金融アナリストです。ニュースを読み、**要点**、**顧客への影響**、**提案アクション**の形式で日本語で分析してください。マークダウン形式で。",
        messages: [{ role: "user", content: article.title + "\n\n" + article.summary }],
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var text = (data.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
      setAiText(text || "分析できませんでした");
      setAiLoading(false);
    })
    .catch(function() { setAiText("エラーが発生しました"); setAiLoading(false); });
  }

  function saveMemo() {
    if (!selected) return;
    var now = new Date();
    var t = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
    setMemos(function(prev) { return [Object.assign({}, selected, { aiText: aiText, savedAt: t })].concat(prev); });
    showToast("提案メモに保存しました");
    setSelected(null);
  }

  function md(t) {
    return t.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#C9A84C">$1</strong>').replace(/\n/g, "<br/>");
  }

  var S = {
    root: { fontFamily: "Georgia,serif", background: "#080F1C", minHeight: "100vh", color: "#EEE8DC", maxWidth: 430, margin: "0 auto" },
    header: { background: "rgba(8,15,28,0.97)", borderBottom: "1px solid rgba(201,168,76,0.18)", padding: "14px 18px 0", position: "sticky", top: 0, zIndex: 100 },
    pill: function(a) { return { border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", background: a ? "#C9A84C" : "rgba(255,255,255,0.06)", color: a ? "#080F1C" : "#7A8A9A" }; },
    tabBtn: function(a) { return { flex: 1, border: "none", borderRadius: 8, padding: "7px 0", fontSize: 11, cursor: "pointer", fontFamily: "inherit", background: a ? "#C9A84C" : "rgba(255,255,255,0.05)", color: a ? "#080F1C" : "#6A7A8A", fontWeight: a ? "bold" : "normal" }; },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 15, marginBottom: 10, cursor: "pointer" },
    badge: function(c) { return { fontSize: 9, padding: "2px 8px", borderRadius: 10, background: c + "22", color: c, fontWeight: "bold" }; },
    drawer: { background: "#0D1E35", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "88vh", overflowY: "auto", padding: "22px 18px 40px", border: "1px solid rgba(201,168,76,0.2)", borderBottom: "none" },
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(8,15,28,0.97)", borderTop: "1px solid rgba(201,168,76,0.15)", display: "flex", justifyContent: "space-around", padding: "10px 0 22px", zIndex: 90 },
  };

  return (
    <div style={S.root}>
      {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#C9A84C", color: "#080F1C", padding: "10px 22px", borderRadius: 40, fontSize: 13, fontWeight: "bold", zIndex: 9999 }}>{toast}</div>}

      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 4 }}>LG ASSET</div>
            <div style={{ fontSize: 17, fontWeight: "bold", letterSpacing: 2 }}>Advisor Intelligence</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {lastUpdated && <div style={{ fontSize: 9, color: "#4A5A6A" }}>更新 {lastUpdated}</div>}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#7A5200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", color: "#080F1C" }}>H</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {[["news","ニュース"],["memo","メモ" + (memos.length > 0 ? " (" + memos.length + ")" : "")]].map(function(item) {
            return <button key={item[0]} onClick={function() { setTab(item[0]); }} style={S.tabBtn(tab === item[0])}>{item[1]}</button>;
          })}
        </div>
      </div>

      {tab === "news" && (
        <div style={{ padding: "0 14px 100px" }}>
          <div style={{ display: "flex", gap: 6, padding: "10px 0", overflowX: "auto" }}>
            {RSS_FEEDS.map(function(f) {
              return <button key={f.id} onClick={function() { setActiveFeed(f.id); setCategory("すべて"); }} style={S.pill(activeFeed === f.id)}>{f.label}</button>;
            })}
            <button onClick={function() { fetchNews(activeFeed); }} style={S.pill(false)}>↻ 更新</button>
          </div>
          <div style={{ display: "flex", gap: 6, padding: "4px 0 12px", overflowX: "auto" }}>
            {CATEGORIES.map(function(c) {
              return <button key={c} onClick={function() { setCategory(c); }} style={S.pill(category === c)}>{c}</button>;
            })}
          </div>

          {loading && <div style={{ textAlign: "center", padding: "60px 20px", color: "#4A5A6A" }}>📡 取得中...</div>}

          {!loading && error && (
            <div style={{ background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ color: "#E05C5C", marginBottom: 12 }}>{error}</div>
              <button onClick={function() { fetchNews(activeFeed); }} style={{ background: "#C9A84C", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 12, color: "#080F1C", cursor: "pointer" }}>再試行</button>
            </div>
          )}

          {!loading && !error && filtered.map(function(a) {
            return (
              <div key={a.id} onClick={function() { openArticle(a); }} style={Object.assign({}, S.card, { borderColor: a.impact === "high" ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)" })}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={S.badge(IMPACT[a.impact])}>{IMPACT_LABEL[a.impact]}</span>
                    <span style={{ fontSize: 10, color: "#5A6A7A" }}>{a.category}</span>
                  </div>
                  <span style={{ fontSize: 10, color: "#4A5A6A" }}>{a.time}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: "bold", lineHeight: 1.5, color: "#EEE8DC", marginBottom: 6 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: "#7A8A9A" }}>{a.summary.slice(0, 60)}...</div>
                <div style={{ textAlign: "right", marginTop: 8 }}><span style={{ fontSize: 10, color: "#C9A84C" }}>AI分析を見る →</span></div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "memo" && (
        <div style={{ padding: "14px 14px 100px" }}>
          {memos.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#3A4A5A" }}><div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>ニュース詳細から保存してください</div>
            : memos.map(function(m, i) {
                return (
                  <div key={i} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={S.badge(IMPACT[m.impact])}>{IMPACT_LABEL[m.impact]}</span>
                      <span style={{ fontSize: 10, color: "#4A5A6A" }}>保存 {m.savedAt}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: "#EEE8DC", marginBottom: 10 }}>{m.title}</div>
                    <button onClick={function() { setMemos(function(prev) { return prev.filter(function(_, j) { return j !== i; }); }); showToast("削除しました"); }}
                      style={{ background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.25)", borderRadius: 8, padding: "6px 14px", fontSize: 11, color: "#E05C5C", cursor: "pointer" }}>削除</button>
                  </div>
                );
              })
          }
        </div>
      )}

      <div style={S.bottomNav}>
        {[["news","📰","ニュース"],["memo","📋","メモ"]].map(function(item) {
          return (
            <div key={item[0]} onClick={function() { setTab(item[0]); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === item[0] ? "#C9A84C" : "#3A4A5A", fontSize: 9, cursor: "pointer" }}>
              <span style={{ fontSize: 22 }}>{item[1]}</span>{item[2]}
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,8,16,0.9)", display: "flex", alignItems: "flex-end" }} onClick={function() { setSelected(null); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={S.drawer}>
            <div style={{ width: 36, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 18px" }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <span style={S.badge(IMPACT[selected.impact])}>{IMPACT_LABEL[selected.impact]}</span>
              <span style={{ fontSize: 10, color: "#6A7A8A" }}>{selected.category} · {selected.time}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: "bold", lineHeight: 1.6, color: "#EEE8DC", marginBottom: 12 }}>{selected.title}</h2>
            <p style={{ fontSize: 13, color: "#9AAABB", lineHeight: 1.8, marginBottom: 16 }}>{selected.summary}</p>
            {selected.link && (
              <a href={selected.link} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", textAlign: "center", fontSize: 11, color: "#6B9FD4", marginBottom: 16, border: "1px solid rgba(107,159,212,0.25)", borderRadius: 8, padding: 8, textDecoration: "none" }}>
                📎 元記事を読む
              </a>
            )}
            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: "bold", letterSpacing: 2, marginBottom: 10 }}>✦ AI アドバイザー分析</div>
              {aiLoading
                ? <div style={{ color: "#6A7A8A", fontSize: 12 }}>分析中...</div>
                : <div style={{ fontSize: 12, color: "#C8D4E0", lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: md(aiText) }} />}
            </div>
            <button onClick={saveMemo} style={{ width: "100%", background: "linear-gradient(135deg,#C9A84C,#8B6810)", color: "#080F1C", border: "none", borderRadius: 12, padding: 14, fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>
              📋 提案メモに保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

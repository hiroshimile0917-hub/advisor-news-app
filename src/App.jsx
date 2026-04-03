import { useState } from "react";

export default function App() {
  const [tab, setTab] = useState("news");

  return (
    <div style={{ background: "#080F1C", minHeight: "100vh", color: "#EEE8DC", maxWidth: 430, margin: "0 auto", fontFamily: "serif" }}>
      <div style={{ background: "#0B1525", padding: "16px 18px", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 4 }}>LG ASSET</div>
        <div style={{ fontSize: 17, fontWeight: "bold" }}>Advisor Intelligence</div>
      </div>
      <div style={{ padding: 16 }}>
        <p style={{ color: "#C9A84C" }}>✅ アプリが正常に動作しています</p>
        <p style={{ fontSize: 13, color: "#8A9BAC" }}>次のステップ：RSS連携を追加します</p>
      </div>
    </div>
  );
}
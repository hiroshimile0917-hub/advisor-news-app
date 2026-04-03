export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  const { feed = "st" } = req.query;

  const queries = {
    st: "日本株 株価 決算",
    fx: "ドル円 為替 FRB",
    mk: "日経平均 マーケット 相場",
  };

  const q = encodeURIComponent(queries[feed] || queries.st);
  const url = `https://news.google.com/rss/search?q=${q}&hl=ja&gl=JP&ceid=JP:ja`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
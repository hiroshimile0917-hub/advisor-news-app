export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { feed = "st" } = req.query;
  const apiKey = process.env.GNEWS_API_KEY;

  const queries = {
    st: "株価 OR 決算 OR 日本株 OR 東証",
    fx: "為替 OR ドル円 OR 円安 OR 円高",
    mk: "日経平均 OR マーケット OR 日銀 OR NISA",
  };

  const q = encodeURIComponent(queries[feed] || queries.st);
  const url = `https://gnews.io/api/v4/search?q=${q}&lang=ja&country=jp&max=10&sortby=publishedAt&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error: " + response.status);
    const data = await response.json();
    if (!data.articles) throw new Error("記事なし");

    const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${data.articles.map(a => `<item><title><![CDATA[${a.title || ""}]]></title><description><![CDATA[${a.description || ""}]]></description><link>${a.url || ""}</link><pubDate>${a.publishedAt || ""}</pubDate></item>`).join("")}</channel></rss>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(rss);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

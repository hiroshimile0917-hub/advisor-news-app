export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  const { feed = "st" } = req.query;

  const urls = {
    st: "https://www3.nhk.or.jp/rss/news/cat6.xml",
    fx: "https://www3.nhk.or.jp/rss/news/cat6.xml",
    mk: "https://www3.nhk.or.jp/rss/news/cat6.xml",
  };

  try {
    const response = await fetch(urls[feed] || urls.st, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) throw new Error("HTTP error: " + response.status);
    const text = await response.text();
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
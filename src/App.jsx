export default async function handler(req, res) {
  const { feed = "st" } = req.query;

  const urls = {
    st: "https://news.google.com/rss/search?q=日本株+株価&hl=ja&gl=JP&ceid=JP:ja",
    fx: "https://news.google.com/rss/search?q=ドル円+為替&hl=ja&gl=JP&ceid=JP:ja",
    mk: "https://news.google.com/rss/search?q=日経平均+マーケット&hl=ja&gl=JP&ceid=JP:ja",
  };

  const url = urls[feed] || urls.st;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
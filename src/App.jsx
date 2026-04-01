export default async function handler(req, res) {
  const { feed = "st" } = req.query;

  const urls = {
    st: "https://www.jpx.co.jp/rss/news-jp.rdf",
    fx: "https://www.boj.or.jp/rss/news.xml",
    mk: "https://feeds.japan.cnet.com/rss/cnet/all.rdf",
  };

  const url = urls[feed] || urls.st;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AdvisorApp/1.0)",
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
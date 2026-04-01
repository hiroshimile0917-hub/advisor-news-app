 
export default async function handler(req, res) {
  const { feed = "st" } = req.query;

  const urls = {
    st: "https://finance.yahoo.co.jp/rss/topic/st",
    fx: "https://finance.yahoo.co.jp/rss/topic/fx",
    mk: "https://finance.yahoo.co.jp/rss/topic/mk",
  };

  const url = urls[feed] || urls.st;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
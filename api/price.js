module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) return res.status(404).json({ error: `Ticker not found: ${ticker}` });

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: `No data for: ${ticker}` });

    const meta = result.meta;
    const price         = meta.regularMarketPrice ?? meta.previousClose ?? null;
    const previousClose = meta.previousClose ?? null;
    const currency      = meta.currency ?? 'USD';
    const exchange      = meta.fullExchangeName ?? meta.exchangeName ?? '';
    const longName      = meta.longName ?? meta.shortName ?? ticker;
    const change        = price && previousClose ? price - previousClose : null;
    const changePct     = change && previousClose ? (change / previousClose) * 100 : null;
    const marketCap     = meta.marketCap ?? null;

    return res.status(200).json({
      ticker: meta.symbol ?? ticker,
      longName,
      price,
      previousClose,
      change,
      changePct,
      currency,
      exchange,
      marketCap: marketCap ? marketCap / 1e9 : null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

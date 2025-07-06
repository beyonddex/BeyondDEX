export default async function handler(req, res) {
  try {
    const [cmcRes, fngRes, binanceRes] = await Promise.all([
      fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
      }),
      fetch('https://api.alternative.me/fng/'),
      fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT')
    ]);

    const cmcData = await cmcRes.json();
    const fngData = await fngRes.json();
    const binanceData = await binanceRes.json();

    const btcDom = parseFloat(cmcData.data.btc_dominance).toFixed(2);
    const ethDom = parseFloat(cmcData.data.eth_dominance).toFixed(2);
    const btcEthRatio = (btcDom / ethDom).toFixed(2);

    let fundingRate = 'Unavailable';
    if (binanceData.lastFundingRate !== undefined && !isNaN(binanceData.lastFundingRate)) {
      fundingRate = (parseFloat(binanceData.lastFundingRate) * 100).toFixed(4);
    }

    const fearGreed = `${fngData.data[0].value} (${fngData.data[0].value_classification})`;

    res.status(200).json({
      btcDom,
      ethDom,
      btcEthRatio,
      fundingRate,
      fearGreed
    });
  } catch (e) {
    console.error('Market data API error:', e);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}

export default async function handler(req, res) {
  try {
    const headers = {
      'User-Agent': 'BeyondDEX/1.0 (+https://yourdomain.com)'
    };

    const [
      cmcRes,
      fngRes,
      binanceFundingRes,
      binanceOIRes
    ] = await Promise.all([
      fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY,
          ...headers
        }
      }),
      fetch('https://api.alternative.me/fng/', { headers }),
      fetch('https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1', { headers }),
      fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=1', { headers })
    ]);

    const cmcData = await cmcRes.json();
    const fngData = await fngRes.json();
    const fundingData = await binanceFundingRes.json();
    const oiData = await binanceOIRes.json();

    const btcDom = cmcData.data.btc_dominance.toFixed(2);
    const ethDom = cmcData.data.eth_dominance.toFixed(2);
    const btcEthRatio = (btcDom / ethDom).toFixed(2);

    const fundingRate = fundingData?.[0]?.fundingRate
      ? (parseFloat(fundingData[0].fundingRate) * 100).toFixed(4) + '%'
      : 'Unavailable';

    const openInterest = oiData?.[0]?.sumOpenInterest
      ? '$' + Number(oiData[0].sumOpenInterest).toLocaleString()
      : 'Unavailable';

    const fearGreed = `${fngData.data[0].value} (${fngData.data[0].value_classification})`;

    res.status(200).json({ btcDom, ethDom, btcEthRatio, fundingRate, openInterest, fearGreed });
  } catch (err) {
    console.error('Error in /api/market-data:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}

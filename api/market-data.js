export default async function handler(req, res) {
  try {
    const [cmcRes, fngRes, cgDerivRes] = await Promise.all([
      fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
      }),
      fetch('https://api.alternative.me/fng/'),
      fetch('https://api.coingecko.com/api/v3/derivatives/exchanges/binance') // returns an object, not array
    ]);

    const cmcData = await cmcRes.json();
    const fngData = await fngRes.json();
    const cgDerivData = await cgDerivRes.json(); // this is an object with a `.tickers` array

    const btcDom = cmcData.data.btc_dominance.toFixed(2);
    const ethDom = cmcData.data.eth_dominance.toFixed(2);
    const btcEthRatio = (btcDom / ethDom).toFixed(2);

    // ✅ Correct way to get from CoinGecko Binance derivatives
    const binanceTicker = cgDerivData.tickers?.find(t =>
      /BTCUSDT/.test(t.symbol) || /BTC\/USDT/.test(t.symbol)
    );

    const fundingRate = binanceTicker?.funding_rate !== undefined
      ? (binanceTicker.funding_rate * 100).toFixed(4) + '%'
      : 'Unavailable';

    const openInterest = binanceTicker?.open_interest !== undefined
      ? '$' + Number(binanceTicker.open_interest).toLocaleString()
      : 'Unavailable';

    const fearGreed = `${fngData.data[0].value} (${fngData.data[0].value_classification})`;

    res.status(200).json({ btcDom, ethDom, btcEthRatio, fundingRate, openInterest, fearGreed });

  } catch (err) {
    console.error('Error fetching market data:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}

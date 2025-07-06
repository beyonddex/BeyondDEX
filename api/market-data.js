export default async function handler(req, res) {
  try {
    const [cmcRes, fngRes] = await Promise.all([
      fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
      }),
      fetch('https://api.alternative.me/fng/')
    ]);

    const cmcData = await cmcRes.json();
    const fngData = await fngRes.json();

    const btcDom = cmcData.data.btc_dominance.toFixed(2);
    const ethDom = cmcData.data.eth_dominance.toFixed(2);
    const btcEthRatio = (btcDom / ethDom).toFixed(2);
    const fearGreed = `${fngData.data[0].value} (${fngData.data[0].value_classification})`;

    let fundingRate = 'Unavailable';
    let openInterest = 'Unavailable';

    // 🔹 Try Binance first
    try {
      const [binanceFundingRes, binanceOIRes] = await Promise.all([
        fetch('https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1'),
        fetch('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=1')
      ]);
      const fundingData = await binanceFundingRes.json();
      const oiData = await binanceOIRes.json();

      if (fundingData?.[0]?.fundingRate) {
        fundingRate = (parseFloat(fundingData[0].fundingRate) * 100).toFixed(4) + '%';
      }

      if (oiData?.[0]?.sumOpenInterest) {
        openInterest = '$' + Number(oiData[0].sumOpenInterest).toLocaleString();
      }
    } catch (binanceErr) {
      console.warn('Binance API failed, falling back to OKX/Deribit');
    }

    // 🔁 Fallback: try OKX
    if (fundingRate === 'Unavailable') {
      try {
        const okxRes = await fetch('https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP');
        const okxData = await okxRes.json();
        if (okxData?.data?.[0]?.fundingRate) {
          fundingRate = (parseFloat(okxData.data[0].fundingRate) * 100).toFixed(4) + '%';
        }
      } catch (okxErr) {
        console.warn('OKX funding fallback failed.');
      }
    }

    // 🔁 Fallback: try Deribit
    if (fundingRate === 'Unavailable') {
      try {
        const deribitRes = await fetch('https://www.deribit.com/api/v2/public/get_funding_rate_value?instrument_name=BTC-PERPETUAL');
        const deribitData = await deribitRes.json();
        if (deribitData?.result?.funding_rate) {
          fundingRate = (parseFloat(deribitData.result.funding_rate) * 100).toFixed(4) + '%';
        }
      } catch (deribitErr) {
        console.warn('Deribit funding fallback failed.');
      }
    }

    res.status(200).json({ btcDom, ethDom, btcEthRatio, fundingRate, openInterest, fearGreed });

  } catch (err) {
    console.error('Error in /api/market-data:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}

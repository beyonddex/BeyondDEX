export default async function handler(req, res) {
  try {
    const [cmcRes, fngRes, whaleRes, flowRes] = await Promise.all([
      fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
      }),
      fetch('https://api.alternative.me/fng/'),
      fetch(`https://api.whale-alert.io/v1/transactions?api_key=${process.env.WHALE_ALERT_KEY}&min_value=500000`),
      fetch('https://api.cryptoquant.com/v1/btc-exchange-flows', {
        headers: { Authorization: `Bearer ${process.env.CRYPTOQUANT_KEY}` }
      })
    ]);

    const cmcData = await cmcRes.json();
    const fngData = await fngRes.json();
    const whaleData = await whaleRes.json();
    const flowData = await flowRes.json();

    const btcDom = cmcData.data.btc_dominance.toFixed(2);
    const ethDom = cmcData.data.eth_dominance.toFixed(2);
    const btcEthRatio = (btcDom / ethDom).toFixed(2);
    const totalMarketCap = `$${Number(cmcData.data.quote.USD.total_market_cap).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const fearGreed = `${fngData.data[0].value} (${fngData.data[0].value_classification})`;

    // Whale transactions (top 5)
    const whales = whaleData.transactions?.slice(0, 5) || [];

    // Exchange flows
    const latestFlow = flowData?.result?.data?.slice(-1)?.[0] || {};
    const inflow = latestFlow.inflow_total || 0;
    const outflow = latestFlow.outflow_total || 0;
    const netflow = latestFlow.netflow || 0;

    // Funding Rate + Open Interest with fallbacks
    let fundingRate = 'Unavailable';
    let openInterest = 'Unavailable';

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
    } catch {
      console.warn('Binance funding/open interest failed.');
    }

    if (fundingRate === 'Unavailable') {
      try {
        const okxRes = await fetch('https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP');
        const okxData = await okxRes.json();
        if (okxData?.data?.[0]?.fundingRate) {
          fundingRate = (parseFloat(okxData.data[0].fundingRate) * 100).toFixed(4) + '%';
        }
      } catch {
        console.warn('OKX funding fallback failed.');
      }
    }

    if (fundingRate === 'Unavailable') {
      try {
        const deribitRes = await fetch('https://www.deribit.com/api/v2/public/get_funding_rate_value?instrument_name=BTC-PERPETUAL');
        const deribitData = await deribitRes.json();
        if (deribitData?.result?.funding_rate) {
          fundingRate = (parseFloat(deribitData.result.funding_rate) * 100).toFixed(4) + '%';
        }
      } catch {
        console.warn('Deribit funding fallback failed.');
      }
    }

    res.status(200).json({
      btcDom,
      ethDom,
      btcEthRatio,
      fundingRate,
      openInterest,
      fearGreed,
      totalMarketCap,
      whales,
      inflow,
      outflow,
      netflow
    });
  } catch (err) {
    console.error('Error in /api/market-data:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}

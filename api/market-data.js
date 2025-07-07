const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [cmcRes, fngRes, whaleRes, flowRes] = await Promise.all([
      axios.get('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
      }),
      axios.get('https://api.alternative.me/fng/'),
      axios.get(`https://api.whale-alert.io/v1/transactions?api_key=${process.env.WHALE_ALERT_KEY}&min_value=500000`),
      axios.get('https://api.cryptoquant.com/v1/btc-exchange-flows', {
        headers: { Authorization: `Bearer ${process.env.CRYPTOQUANT_KEY}` }
      })
    ]);

    const cmcData = cmcRes.data;
    const fngData = fngRes.data;
    const whaleData = whaleRes.data;
    const flowData = flowRes.data;

    const btcDom = cmcData.data.btc_dominance.toFixed(2);
    const ethDom = cmcData.data.eth_dominance.toFixed(2);
    const btcEthRatio = (btcDom / ethDom).toFixed(2);
    const totalMarketCap = `$${Number(cmcData.data.quote.USD.total_market_cap).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const fearGreed = `${fngData.data[0].value} (${fngData.data[0].value_classification})`;

    const whales = whaleData.transactions?.slice(0, 5) || [];

    const latestFlow = flowData?.result?.data?.slice(-1)?.[0] || {};
    const inflow = latestFlow.inflow_total || 0;
    const outflow = latestFlow.outflow_total || 0;
    const netflow = latestFlow.netflow || 0;

    let fundingRate = 'Unavailable';
    let openInterest = 'Unavailable';

    try {
      const [binanceFundingRes, binanceOIRes] = await Promise.all([
        axios.get('https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1'),
        axios.get('https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=5m&limit=1')
      ]);

      if (binanceFundingRes.data?.[0]?.fundingRate) {
        fundingRate = (parseFloat(binanceFundingRes.data[0].fundingRate) * 100).toFixed(4) + '%';
      }

      if (binanceOIRes.data?.[0]?.sumOpenInterest) {
        openInterest = '$' + Number(binanceOIRes.data[0].sumOpenInterest).toLocaleString();
      }
    } catch {
      console.warn('Binance funding/open interest failed.');
    }

    if (fundingRate === 'Unavailable') {
      try {
        const okxRes = await axios.get('https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP');
        if (okxRes.data?.data?.[0]?.fundingRate) {
          fundingRate = (parseFloat(okxRes.data.data[0].fundingRate) * 100).toFixed(4) + '%';
        }
      } catch {
        console.warn('OKX funding fallback failed.');
      }
    }

    if (fundingRate === 'Unavailable') {
      try {
        const deribitRes = await axios.get('https://www.deribit.com/api/v2/public/get_funding_rate_value?instrument_name=BTC-PERPETUAL');
        if (deribitRes.data?.result?.funding_rate) {
          fundingRate = (parseFloat(deribitRes.data.result.funding_rate) * 100).toFixed(4) + '%';
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
});

module.exports = router;

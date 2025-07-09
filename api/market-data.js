const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  let btcDom = 'Unavailable';
  let ethDom = 'Unavailable';
  let btcEthRatio = 'Unavailable';
  let totalMarketCap = 'Unavailable';
  let fearGreed = 'Unavailable';
  let whales = [];
  let inflow = 0;
  let outflow = 0;
  let netflow = 0;
  let fundingRate = 'Unavailable';
  let openInterest = 'Unavailable';

  try {
    // CoinMarketCap
    try {
      const cmcRes = await axios.get('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
      });
      const cmcData = cmcRes.data;
      btcDom = cmcData.data.btc_dominance.toFixed(2);
      ethDom = cmcData.data.eth_dominance.toFixed(2);
      btcEthRatio = (btcDom / ethDom).toFixed(2);
      totalMarketCap = `$${Number(cmcData.data.quote.USD.total_market_cap).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    } catch (err) {
      console.warn('❌ CoinMarketCap data failed:', err.message);
    }

    // Fear & Greed Index
    try {
      const fngRes = await axios.get('https://api.alternative.me/fng/');
      fearGreed = `${fngRes.data.data[0].value} (${fngRes.data.data[0].value_classification})`;
    } catch (err) {
      console.warn('❌ Fear & Greed Index fetch failed:', err.message);
    }

    // Whale Alert
    try {
      const whaleRes = await axios.get(`https://api.whale-alert.io/v1/transactions?api_key=${process.env.WHALE_ALERT_KEY}&min_value=500000`);
      whales = whaleRes.data.transactions?.slice(0, 5) || [];
    } catch (err) {
      console.warn('❌ Whale Alert fetch failed:', err.message);
    }

    // CryptoQuant
    try {
      if (process.env.CRYPTOQUANT_KEY) {
        const flowRes = await axios.get('https://api.cryptoquant.com/v1/btc-exchange-flows', {
          headers: { Authorization: `Bearer ${process.env.CRYPTOQUANT_KEY}` }
        });
        const latestFlow = flowRes?.data?.result?.data?.slice(-1)?.[0] || {};
        inflow = latestFlow.inflow_total || 0;
        outflow = latestFlow.outflow_total || 0;
        netflow = latestFlow.netflow || 0;
      } else {
        console.warn('⚠️ CRYPTOQUANT_KEY is missing.');
      }
    } catch (err) {
      console.warn('❌ CryptoQuant fetch failed:', err.message);
    }

    // Binance (primary)
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
      console.warn('⚠️ Binance funding/open interest failed.');
    }

    // OKX (fallback)
    if (fundingRate === 'Unavailable') {
      try {
        const okxRes = await axios.get('https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP');
        if (okxRes.data?.data?.[0]?.fundingRate) {
          fundingRate = (parseFloat(okxRes.data.data[0].fundingRate) * 100).toFixed(4) + '%';
        }
      } catch {
        console.warn('⚠️ OKX funding fallback failed.');
      }
    }

    // Deribit (last fallback)
    if (fundingRate === 'Unavailable') {
      try {
        const deribitRes = await axios.get('https://www.deribit.com/api/v2/public/get_funding_rate_value?instrument_name=BTC-PERPETUAL');
        if (deribitRes.data?.result?.funding_rate) {
          fundingRate = (parseFloat(deribitRes.data.result.funding_rate) * 100).toFixed(4) + '%';
        }
      } catch {
        console.warn('⚠️ Deribit funding fallback failed.');
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
    console.error('❌ Critical error in /api/market-data:', err.message);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

module.exports = router;

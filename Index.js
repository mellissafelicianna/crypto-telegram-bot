import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const MAX_LOSS = 15.50;
const TP_PERCENT = 0.03;
const SL_PERCENT = 0.01;

const COINS = [
  { id: "bitcoin", symbol: "BTCUSDT" },
  { id: "ethereum", symbol: "ETHUSDT" },
  { id: "solana", symbol: "SOLUSDT" },
  { id: "ripple", symbol: "XRPUSDT" },
  { id: "binancecoin", symbol: "BNBUSDT" }
];

async function checkSignals() {
  let alerts = "";

  for (const coin of COINS) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart`,
        {
          params: { vs_currency: "usd", days: 1, interval: "minute" },
          headers: { "User-Agent": "Mozilla/5.0 (Crypto Bot)" },
        }
      );

      const closes = response.data.prices.map((p) => p[1]);
      const latestPrice = closes[closes.length - 1];
      const oldPrice = closes[closes.length - 60];
      const priceChange = ((latestPrice - oldPrice) / oldPrice) * 100;

      let signal = null;
      if (priceChange < -2) signal = "BUY";
      if (priceChange > 2) signal = "SELL";

      if (signal) {
        const stopLoss =
          signal === "BUY"
            ? (latestPrice * (1 - SL_PERCENT)).toFixed(2)
            : (latestPrice * (1 + SL_PERCENT)).toFixed(2);

        const takeProfit =
          signal === "BUY"
            ? (latestPrice * (1 + TP_PERCENT)).toFixed(2)
            : (latestPrice * (1 - TP_PERCENT)).toFixed(2);

        const positionSize = (
          MAX_LOSS / Math.abs(latestPrice - stopLoss)
        ).toFixed(2);

        alerts += `
🚨 *Crypto Alert – ${coin.symbol}*
━━━━━━━━━━━━━━━
📊 Signal: ${signal}
📉 1h Change: ${priceChange.toFixed(2)}%
📈 Entry: ${latestPrice.toFixed(2)}
🛡️ Stop-Loss: ${stopLoss}
🎯 Take-Profit: ${takeProfit}
📦 Position: ${positionSize} units
⚠️ Max loss: €${MAX_LOSS}\n
        `;
      }
    } catch (error) {
      alerts += `❌ Error for ${coin.symbol}: ${error.message}\n`;
    }
  }

  const message =
    alerts || "✅ No strong trading signals detected right now.";

  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  });
}

checkSignals();
setInterval(checkSignals, 5 * 60 * 1000); // Elke 5 minuten

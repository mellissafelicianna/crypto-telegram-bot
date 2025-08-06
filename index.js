import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const TP_PERCENT = 0.03;  // 3% winstdoel
const SL_PERCENT = 0.01;  // 1% stoploss

const COINS = [
  { id: "bitcoin", symbol: "BTCUSDT" },
  { id: "ethereum", symbol: "ETHUSDT" },
  { id: "solana", symbol: "SOLUSDT" },
  { id: "ripple", symbol: "XRPUSDT" },
  { id: "binancecoin", symbol: "BNBUSDT" },
];

async function checkSignals() {
  console.log("🔎 Checking signals...");

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
      if (closes.length < 60) continue;

      const latestPrice = closes[closes.length - 1];
      const oldPrice = closes[closes.length - 60];
      const priceChange = ((latestPrice - oldPrice) / oldPrice) * 100;

      let signal = "";
      if (priceChange <= -2) signal = "BUY";
      if (priceChange >= 2) signal = "SELL";

      if (signal) {
        const stoploss =
          signal === "BUY"
            ? latestPrice * (1 - SL_PERCENT)
            : latestPrice * (1 + SL_PERCENT);

        const takeprofit =
          signal === "BUY"
            ? latestPrice * (1 + TP_PERCENT)
            : latestPrice * (1 - TP_PERCENT);

        alerts += `
🚨 *TRADE ALERT* 🚨
Coin: ${coin.symbol}
Signal: ${signal}
Entry: $${latestPrice.toFixed(2)}
Stop-Loss: $${stoploss.toFixed(2)}
Take-Profit: $${takeprofit.toFixed(2)}
-------------------------------\n`;
      }
    } catch (error) {
      console.error(`⚠️ Error for ${coin.symbol}:`, error.message);
    }
  }

  if (alerts) {
    await sendTelegramMessage(alerts);
  }
}

async function sendTelegramMessage(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
    console.log("✅ Alert sent to Telegram");
  } catch (error) {
    console.error("❌ Telegram error:", error.message);
  }
}

setInterval(checkSignals, 60000);
checkSignals();

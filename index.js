import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const COINS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT"];
const MAX_LOSS = 15.75;
const TARGET_PROFIT = 400;
const ENTRY_AMOUNT = 62.50;

// ✅ Functie om Telegram-bericht te sturen
async function sendTelegramMessage(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown"
    });
  } catch (error) {
    console.error("Telegram Fout:", error.message);
  }
}

// ✅ AI-scanner: berekent RSI & beslist buy/sell
async function scanMarket() {
  for (const symbol of COINS) {
    try {
      const response = await axios.get(`https://api.bybit.com/v5/market/kline`, {
        params: { category: "spot", symbol, interval: "15", limit: 100 }
      });

      const closes = response.data.result.list.map(c => parseFloat(c[4]));
      const latestPrice = closes[closes.length - 1];

      // RSI berekening
      const gains = [], losses = [];
      for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains.push(change);
        else losses.push(Math.abs(change));
      }
      const avgGain = gains.reduce((a, b) => a + b, 0) / (gains.length || 1);
      const avgLoss = losses.reduce((a, b) => a + b, 0) / (losses.length || 1);
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));

      let signal = null;
      if (rsi < 30) signal = "BUY";
      if (rsi > 70) signal = "SELL";

      if (signal) {
        // Bereken Take-Profit en Stop-Loss
        const stopLoss = signal === "BUY"
          ? latestPrice * 0.99
          : latestPrice * 1.01;
        const takeProfit = signal === "BUY"
          ? latestPrice * 1.03
          : latestPrice * 0.97;

        // Bereken inzet om €400 winst te halen
        const priceDiff = Math.abs(takeProfit - latestPrice);
        const amountNeeded = (TARGET_PROFIT / priceDiff).toFixed(2);

        const message = `
🚀 *${signal} ALERT – ${symbol}*
━━━━━━━━━━━━━━━
📈 Entry prijs: ${latestPrice.toFixed(2)}
🎯 Take-Profit: ${takeProfit.toFixed(2)}
🛡️ Stop-Loss: ${stopLoss.toFixed(2)}
💸 Inzet: €${amountNeeded}
⚠️ Max verlies: €${MAX_LOSS}
📊 RSI: ${rsi.toFixed(2)}  
`;

        await sendTelegramMessage(message);
      }

    } catch (err) {
      console.error(`Fout bij ${symbol}:`, err.message);
    }
  }
}

// ✅ Webhook voor TradingView alerts
app.post("/webhook", async (req, res) => {
  const alert = req.body;
  if (!alert || !alert.signal) return res.status(400).send("Ongeldig alert");

  const message = `
📢 *TradingView Alert – ${alert.symbol}*
━━━━━━━━━━━━━━━
Signal: ${alert.signal}
Prijs: ${alert.price}
Inzet: €${alert.amount}
Max verlies: €${alert.maxLoss}
Target winst: €${alert.targetProfit}
`;

  await sendTelegramMessage(message);
  return res.status(200).send("OK");
});

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Bot draait 24/7 op poort ${PORT}`));

// ✅ Interval scanner elke 5 min
setInterval(scanMarket, 5 * 60 * 1000);

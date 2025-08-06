const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  });
}

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    const symbol = data.symbol || "?";
    const price = parseFloat(data.price) || 0;
    const signal = (data.signal || "UNKNOWN").toUpperCase();
    const filters = data.filters || {};
    const maxLoss = 15.75;
    const targetProfit = 400;
    const stopLoss = price * 0.99; // 1% stop-loss (voorbeeld)
    const takeProfit = price * 1.03; // 3% winsttarget
    const riskPerTrade = maxLoss;
    const positionSize = (riskPerTrade / Math.abs(price - stopLoss)).toFixed(2);

    let message = "";

    if (signal === "BUY") {
      message = `🟢 *BUY ALERT – ${symbol}*\n━━━━━━━━━━━━━━━\n📊 Prijs: $${price.toFixed(
        2
      )}\n🎯 Take-Profit: $${takeProfit.toFixed(
        2
      )}\n🛡️ Stop-Loss: $${stopLoss.toFixed(
        2
      )}\n📦 Inzet: €${positionSize}\n💰 Verwachte winst: €${targetProfit}\n✅ Filters: Bollinger ${
        filters.bollinger || "nvt"
      }, Volatiliteit ${filters.atr || "nvt"}\n⏱️ Tijd: ${
        data.time || "onbekend"
      }`;
    } else if (signal === "SELL") {
      message = `🔴 *SELL ALERT – ${symbol}*\n━━━━━━━━━━━━━━━\n📊 Prijs: $${price.toFixed(
        2
      )}\n💰 Gerealiseerde winst: €${targetProfit}\n🔒 Risico: max €${maxLoss}\n✅ Filters: Bollinger ${
        filters.bollinger || "nvt"
      }, Volatiliteit ${filters.atr || "nvt"}\n⏱️ Tijd: ${
        data.time || "onbekend"
      }`;
    } else {
      message = `⚠️ Onbekend signaal ontvangen:\n${JSON.stringify(data)}`;
    }

    await sendTelegramMessage(message);
    res.status(200).send("✅ Signal sent to Telegram");
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).send("❌ Error processing webhook");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



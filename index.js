// ✅ index.js – Crypto Telegram Bot (Pro Edition)

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ✅ Fallback check
if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.error("❌ ERROR: Missing TELEGRAM_TOKEN or CHAT_ID in environment variables.");
  process.exit(1);
}

const sendTelegramMessage = async (message) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("❌ Failed to send Telegram message:", err.message);
  }
};

// ✅ Webhook endpoint voor TradingView alerts
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    const symbol = data.symbol || "?";
    const price = parseFloat(data.price) || 0;
    const signal = (data.signal || "UNKNOWN").toUpperCase();
    const positionSize = data.positionSize || "?";
    const stopLoss = data.stopLoss || "?";
    const takeProfit = data.takeProfit || "?";
    const targetProfit = 400;
    const maxLoss = 15.75;

    let message;
    if (signal === "BUY") {
      message = `🟢 *BUY SIGNAL*\n━━━━━━━━━━━━━━━
📊 *Coin:* ${symbol}
💵 *Instapprijs:* $${price}
📦 *Positiegrootte:* ${positionSize} units
🛡️ *Stop-Loss:* $${stopLoss}
🎯 *Take-Profit:* $${takeProfit}
💰 *Verwachte winst:* €${targetProfit}
⚠️ *Max verlies:* €${maxLoss}`;
    } else if (signal === "SELL") {
      message = `🔴 *SELL SIGNAL*\n━━━━━━━━━━━━━━━
📊 *Coin:* ${symbol}
💵 *Verkoopprijs:* $${price}
✅ *Winst veiligstellen / verlies beperken*`;
    } else {
      message = `⚠️ *Onbekend signaal ontvangen:*\n${JSON.stringify(data)}`;
    }

    await sendTelegramMessage(message);
    res.status(200).send("✅ Signal processed successfully");
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(500).send("Error processing webhook");
  }
});

// ✅ Healthcheck endpoint
app.get("/", (req, res) => {
  res.send("✅ Crypto Telegram Bot is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



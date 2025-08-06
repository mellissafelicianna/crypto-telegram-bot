const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const sendTelegramMessage = async (message) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  });
};

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;
    const symbol = data.symbol || "?";
    const price = parseFloat(data.price) || 0;
    const signal = data.signal?.toUpperCase() || "UNKNOWN";
    const positionSize = data.positionSize || "?";
    const stopLoss = data.stopLoss || "?";
    const takeProfit = data.takeProfit || "?";
    const targetProfit = 400;
    const maxLoss = 15.75;

    let message = "";
    if (signal === "BUY") {
      message = `🟢 *BUY SIGNAL*\n━━━━━━━━━━━━━━━\n📊 *Coin:* ${symbol}\n💵 *Instapprijs:* $${price}\n📦 *Positiegrootte:* ${positionSize} units\n🛡️ *Stop-Loss:* $${stopLoss}\n🎯 *Take-Profit:* $${takeProfit}\n💰 *Verwachte winst:* €${targetProfit}\n⚠️ *Max verlies:* €${maxLoss}`;
    } else if (signal === "SELL") {
      message = `🔴 *SELL SIGNAL*\n━━━━━━━━━━━━━━━\n📊 *Coin:* ${symbol}\n💵 *Verkoopprijs:* $${price}\n✅ *Winst veiligstellen / verlies beperken*`;
    } else {
      message = `⚠️ Onbekend signaal ontvangen: ${JSON.stringify(data)}`;
    }

    await sendTelegramMessage(message);
    res.status(200).send("Signal sent");
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).send("Error processing webhook");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


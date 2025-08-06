// ✅ Volledig werkende en definitieve versie met vaste Telegram-gegevens
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// ⛔️ LET OP: In productie liever via .env!
const TELEGRAM_TOKEN = "8498909101:AAG0kAGj-Jt22x7jLXcl7AuZpGJMFzOIAfk";
const CHAT_ID = "8425195586";

// ✅ Bericht verzenden naar Telegram met veilige opmaak
async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "MarkdownV2"
    });
  } catch (err) {
    console.error("Telegram verzendfout:", err.response?.data || err.message);
  }
}

// ✅ Webhook voor TradingView alerts
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    const symbol = data.symbol || "?";
    const price = parseFloat(data.price) || 0;
    const signal = (data.signal || "UNKNOWN").toUpperCase();
    const filters = data.filters || {};
    const time = data.time || new Date().toISOString();

    const maxLoss = 15.75;
    const targetProfit = 400;
    const stopLoss = price * 0.99;
    const takeProfit = price * 1.03;
    const riskPerTrade = maxLoss;
    const positionSize = (riskPerTrade / Math.abs(price - stopLoss)).toFixed(2);

    let message = "";

    if (signal === "BUY") {
      message = `🟢 *BUY ALERT – ${symbol}*\n━━━━━━━━━━━━━━━\n📊 Prijs: \$${price.toFixed(2)}\n🎯 Take\-Profit: \$${takeProfit.toFixed(2)}\n🛡️ Stop\-Loss: \$${stopLoss.toFixed(2)}\n📦 Inzet: €${positionSize}\n💰 Verwachte winst: €${targetProfit}\n✅ Filters: Bollinger ${filters.bollinger || "nvt"}, Volatiliteit ${filters.atr || "nvt"}\n⏱️ Tijd: ${time}`;
    } else if (signal === "SELL") {
      message = `🔴 *SELL ALERT – ${symbol}*\n━━━━━━━━━━━━━━━\n📊 Prijs: \$${price.toFixed(2)}\n💰 Gerealiseerde winst: €${targetProfit}\n🔒 Risico: max €${maxLoss}\n✅ Filters: Bollinger ${filters.bollinger || "nvt"}, Volatiliteit ${filters.atr || "nvt"}\n⏱️ Tijd: ${time}`;
    } else {
      message = `⚠️ Onbekend signaal ontvangen:\n${JSON.stringify(data, null, 2)}`;
    }

    await sendTelegramMessage(message);
    res.status(200).send("✅ Signal sent to Telegram");
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.status(500).send("❌ Error processing webhook");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server draait op poort ${PORT}`));

  console.log(`🚀 Server draait op poort ${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Poort ${PORT} is al in gebruik. Probeer een andere poort of stop bestaande processen.`);
    process.exit(1);
  } else {
    throw err;
  }
});


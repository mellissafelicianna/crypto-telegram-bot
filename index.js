import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let dailyProfit = 0; // Houd winst per dag bij
const TRADE_AMOUNT = 62.50;
const MAX_LOSS = 15.75;
const DAILY_TARGET = 400;
const MAX_TRADES = 5;
let tradeCount = 0;

// ✅ Functie: Telegram melding sturen
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

// ✅ Webhook endpoint voor TradingView alerts
app.post("/webhook", async (req, res) => {
  const alert = req.body;

  if (!alert || !alert.signal) {
    return res.status(400).send("Ongeldig alert");
  }

  // Basis trade logica
  if (tradeCount >= MAX_TRADES) {
    await sendTelegramMessage("🚫 Maximaal aantal trades bereikt vandaag.");
    return res.status(200).send("Max trades");
  }

  let actionMessage = "";
  if (alert.signal === "BUY") {
    actionMessage = `🟢 Koop-signaal ontvangen!\nInzet: €${TRADE_AMOUNT}`;
  } else if (alert.signal === "SELL") {
    actionMessage = `🔴 Verkoop-signaal ontvangen!\nInzet: €${TRADE_AMOUNT}`;
  }

  // Winst/verlies simulatie
  const profitLoss = alert.pnl || 0; // TradingView kan 'pnl' sturen
  dailyProfit += profitLoss;

  if (profitLoss <= -MAX_LOSS) {
    actionMessage += `\n⚠️ Max verlies bereikt (-€${Math.abs(profitLoss)})`;
  } else if (dailyProfit >= DAILY_TARGET) {
    actionMessage += `\n🎉 Dagelijks winstdoel behaald: €${dailyProfit}`;
  }

  tradeCount++;

  await sendTelegramMessage(actionMessage);
  return res.status(200).send("OK");
});

// ✅ Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Bot draait op poort ${PORT}`);
});

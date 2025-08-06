module.exports = {
  apps: [
    {
      name: "crypto-telegram-bot",
      script: "index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
        TELEGRAM_TOKEN: "YOUR_TELEGRAM_TOKEN",
        CHAT_ID: "YOUR_CHAT_ID"
      }
    }
  ]
};

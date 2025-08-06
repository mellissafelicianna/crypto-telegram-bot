module.exports = {
  apps: [
    {
      name: "tv-telegram-bot",
      script: "index.js",
      env: {
        NODE_ENV: "production",
        TELEGRAM_TOKEN: "8498909101:AAG0kAGj-Jt22x7jLXcl7AuZpGJMFzOIAfk",
        CHAT_ID: "8425195586"
      }
    }
  ]
};

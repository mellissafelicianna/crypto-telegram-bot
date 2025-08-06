module.exports = {
  apps: [
    {
      name: "crypto-telegram-bot",
      script: "index.js",
      watch: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};

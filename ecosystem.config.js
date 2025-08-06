module.exports = {
  apps: [
    {
      name: "crypto-telegram-bot",
      script: "index.js",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};

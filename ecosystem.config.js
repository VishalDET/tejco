# Tejco ERP – PM2 Ecosystem Config
# Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: "tejco-erp",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "C:\\inetpub\\tejco",          // <-- update to actual deploy path
      instances: "max",                    // use all CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
        NEXT_PUBLIC_API_BASE_URL: "https://api.yourdomain.com",  // <-- update
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "C:\\logs\\tejco\\pm2-error.log",
      out_file: "C:\\logs\\tejco\\pm2-out.log",
      merge_logs: true,
    },
  ],
};

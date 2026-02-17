module.exports = {
  apps: [{
    name: 'mcp-service',
    script: './src/index.js',
    instances: process.env.MCP_PM2_INSTANCES || 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: process.env.MCP_PM2_MAX_MEMORY_RESTART || '1G',
    min_uptime: process.env.MCP_PM2_MIN_UPTIME || '10s',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    exp_backoff_restart_delay: 100 // Delay between restarts
  }]
};

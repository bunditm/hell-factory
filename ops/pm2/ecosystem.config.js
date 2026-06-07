module.exports = {
  apps: [
    {
      name: 'hell-factory-monitoring',
      script: 'src/hell-plugin/dist/index.js',
      cwd: '/home/bunditm/projects/hell-factory',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      max_restarts: 50,
      restart_delay: 1000,
      min_uptime: '10s',
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      env: {
        NODE_ENV: 'production',
        SSE_PORT: '3002',
        SSE_HOST: '127.0.0.1',
      },
      error_file: '/home/bunditm/.pm2/logs/hell-factory-monitoring-error.log',
      out_file: '/home/bunditm/.pm2/logs/hell-factory-monitoring-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Pre-start hook: ensure port 3002 is free
      post_update: ['npm install'],
      script: '/home/bunditm/projects/hell-factory/src/hell-plugin/dist/index.js',
      // Auto-restart on crash
      autorestart: true,
    },
  ],
};
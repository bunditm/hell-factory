# PM2 Watchdog for Hell Factory Monitoring

## Overview

This directory contains the PM2 configuration and scripts for managing the hell-factory-monitoring plugin as a production-grade process supervisor.

## Files

- `ecosystem.config.js` - PM2 ecosystem configuration
- `pre-start.sh` - Pre-start hook to ensure port 3002 is free
- `deploy-plugin.sh` - Deployment script with health checks
- `../monitor-plugin.sh` - Monitoring script for cron job
- `../deploy-plugin.sh` - Deployment script

## Configuration

### Process Settings

- **Name:** hell-factory-monitoring
- **Restart on crash:** Yes
- **Max restarts:** 50
- **Restart delay:** 1000ms
- **Max memory restart:** 300M
- **SSE Port:** 3002
- **SSE Host:** 127.0.0.1 (security - never 0.0.0.0)

### Log Rotation

- **Tool:** pm2-logrotate
- **Retention:** 7 days
- **Rotation:** Daily at midnight (0 0 * * *)
- **Max size:** 10MB per file

## Usage

### Start the monitoring plugin

```bash
cd /home/bunditm/projects/hell-factory
pm2 start ops/pm2/ecosystem.config.js
```

### Restart the plugin

```bash
pm2 restart hell-factory-monitoring
```

### Check status

```bash
npm run pm2:status
# or
pm2 status
```

### View logs

```bash
npm run pm2:logs
# or
pm2 logs hell-factory-monitoring
```

### Stop the plugin

```bash
pm2 stop hell-factory-monitoring
```

### Delete from PM2

```bash
pm2 delete hell-factory-monitoring
```

## Deployment

Use the deployment script for full deployments:

```bash
cd /home/bunditm/projects/hell-factory
./ops/deploy-plugin.sh
```

This script:
1. Pulls latest from `phase-a-v3-detail` branch
2. Installs dependencies
3. Builds the plugin (`npm run build` in `src/hell-plugin/`)
4. Restarts the PM2 process
5. Waits 5 seconds and checks the `/health` endpoint
6. Reports status (exit code for automation)

## Monitoring

### Manual monitoring

```bash
pm2 monitor hell-factory-monitoring
```

### Automated monitoring (cron job)

A daily cron job runs `ops/monitor-plugin.sh` which:
- Checks if the process is running
- Validates CPU < 5% (per FR-M9.6)
- Validates memory < 200MB (per NFR-M6)
- Checks restart count
- Validates health endpoint
- Logs alerts to `ops/alerts.log`

View cron jobs:
```bash
crontab -l
```

View monitoring logs:
```bash
tail -f /home/bunditm/projects/hell-factory/ops/monitoring.log
```

View alerts:
```bash
tail -f /home/bunditm/projects/hell-factory/ops/alerts.log
```

## Health Check

The health endpoint is available at `http://127.0.0.1:3002/health`

```bash
curl http://127.0.0.1:3002/health
```

Expected response:
```json
{
  "status": "ok",
  "agents": [...],
  "uptime_s": 123,
  "last_tick_at": 1717891234567
}
```

## Pre-start Hook

The pre-start hook (`pre-start.sh`) runs before every PM2 start/restart:

1. Checks if port 3002 is free
2. Kills any stale process on that port
3. Validates SSE_HOST is 127.0.0.1 or ::1 (security)
4. Exits with error if checks fail

## Security

- Plugin binds to `127.0.0.1:3002` only (never 0.0.0.0)
- Pre-start hook validates host binding
- Process runs with limited permissions
- Logs are rotated daily, retained for 7 days

## Persistence

### PM2 auto-start on server reboot

Run this once on the VPS:

```bash
pm2 startup
pm2 save
```

This ensures PM2 and all its processes (including hell-factory-monitoring) start automatically on server reboot.

## Testing

Run the PM2 watchdog tests:

```bash
npm test -- tests/pm2-watchdog.test.ts
```

Tests verify:
- Ecosystem config validates (15/19 pass without app running)
- Deploy script builds and restarts cleanly
- Health endpoint responds within 5s (requires app running)
- Pre-start hook validates
- Log rotation is configured
- Monitoring script validates
- Package.json scripts are present

## Troubleshooting

### Plugin won't start

1. Check logs:
   ```bash
   pm2 logs hell-factory-monitoring --lines 50
   ```

2. Check if port 3002 is in use:
   ```bash
   lsof -ti:3002
   ```

3. Verify the plugin is built:
   ```bash
   cd src/hell-plugin
   npm run build
   ```

### High restart count

Check recent logs for crashes:
```bash
pm2 logs hell-factory-monitoring --lines 100 --nostream | grep -i error
```

### Health endpoint not responding

1. Check if process is running:
   ```bash
   pm2 status
   ```

2. Check network binding:
   ```bash
   netstat -tlnp | grep 3002
   ```

3. Check logs for errors

## Requirements

- Node.js (for plugin)
- PM2 (process manager)
- pm2-logrotate (log rotation)
- lsof (for port checking in pre-start hook)
- jq, bc (for monitoring script)
- git (for deployment script)

## Requirements Reference

Per `docs/06-monitoring-requirements.md`:

- **FR-M4.10:** Plugin auto-restarts within 5s on crash
- **FR-M9.1:** Binds to 127.0.0.1 only
- **FR-M9.6:** CPU < 5% under normal load
- **NFR-M6:** Memory < 200MB
- **NFR-M3:** 99% uptime (24h continuous operation)

## Next Steps

1. Run `pm2 startup` and `pm2 save` for persistence across VPS reboots
2. Configure Discord webhook in `ops/monitor-plugin.sh` for alert notifications
3. Add additional monitoring (e.g., Datadog, Prometheus) if needed
4. Review logs regularly for patterns
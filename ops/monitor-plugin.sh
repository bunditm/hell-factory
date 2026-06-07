#!/bin/bash
# Monitoring script for hell-factory-monitoring
# Runs via cron job and alerts on high CPU/memory

set -e

# Configuration
APP_NAME="hell-factory-monitoring"
CPU_THRESHOLD=5.0  # % - per FR-M9.6
MEMORY_THRESHOLD=200  # MB - per NFR-M6
LOG_FILE="/home/bunditm/projects/hell-factory/ops/monitoring.log"
ALERT_LOG="/home/bunditm/projects/hell-factory/ops/alerts.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Function to send alert
alert() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $message" | tee -a "${ALERT_LOG}"
    # Optional: Send to Discord webhook
    # curl -X POST "${DISCORD_WEBHOOK_URL}" \
    #     -H "Content-Type: application/json" \
    #     -d "{\"content\": \"⚠️ ${APP_NAME} ALERT: $message\"}"
}

log "Starting health check for ${APP_NAME}"

# Check if app is running
if ! pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    alert "${APP_NAME} is not running!"
    log "CRITICAL: App is not running"
    exit 1
fi

# Get process info
PM2_STATUS=$(pm2 describe "${APP_NAME}" --json 2>/dev/null)
if [ -z "$PM2_STATUS" ]; then
    alert "Failed to get pm2 status for ${APP_NAME}"
    log "ERROR: Failed to get pm2 status"
    exit 1
fi

# Parse CPU and memory (pm2 JSON output)
CPU_USAGE=$(echo "$PM2_STATUS" | jq -r '.[0].monit.cpu' 2>/dev/null || echo "0")
MEMORY_MB=$(echo "$PM2_STATUS" | jq -r '.[0].monit.memory' 2>/dev/null || echo "0")
MEMORY_MB=$(echo "scale=0; ${MEMORY_MB} / 1048576" | bc 2>/dev/null || echo "0")
RESTART_COUNT=$(echo "$PM2_STATUS" | jq -r '.[0].pm2_env.restart_time' 2>/dev/null || echo "0")
STATUS=$(echo "$PM2_STATUS" | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")

log "Status: ${STATUS} | CPU: ${CPU_USAGE}% | Memory: ${MEMORY_MB}MB | Restarts: ${RESTART_COUNT}"

# Check status
if [ "${STATUS}" != "online" ]; then
    alert "${APP_NAME} status is '${STATUS}', expected 'online'"
    log "WARNING: App status is not online"
fi

# Check CPU threshold
CPU_COMPARE=$(echo "${CPU_USAGE} > ${CPU_THRESHOLD}" | bc 2>/dev/null || echo "0")
if [ "$CPU_COMPARE" = "1" ]; then
    alert "${APP_NAME} CPU usage ${CPU_USAGE}% exceeds threshold ${CPU_THRESHOLD}%"
    log "WARNING: CPU usage too high"
fi

# Check memory threshold
MEMORY_COMPARE=$(echo "${MEMORY_MB} > ${MEMORY_THRESHOLD}" | bc 2>/dev/null || echo "0")
if [ "$MEMORY_COMPARE" = "1" ]; then
    alert "${APP_NAME} memory usage ${MEMORY_MB}MB exceeds threshold ${MEMORY_THRESHOLD}MB"
    log "WARNING: Memory usage too high"
fi

# Check restart count (more than 10 restarts in last day is concerning)
if [ "${RESTART_COUNT}" -gt 10 ]; then
    alert "${APP_NAME} has restarted ${RESTART_COUNT} times - may be unstable"
    log "WARNING: High restart count"
fi

# Check health endpoint
if curl -sf http://127.0.0.1:3002/health >/dev/null 2>&1; then
    log "✓ Health endpoint responding"
else
    alert "${APP_NAME} health endpoint not responding"
    log "ERROR: Health endpoint down"
fi

log "Health check completed"
exit 0
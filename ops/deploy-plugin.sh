#!/bin/bash
# Deploy hell-factory-monitoring plugin via pm2
# This script handles the full deployment pipeline

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/home/bunditm/projects/hell-factory"
BRANCH="phase-a-v3-detail"
HEALTH_URL="http://127.0.0.1:3002/health"
HEALTH_TIMEOUT=5  # seconds
MAX_RETRIES=3

echo "=== Hell Factory Monitoring Plugin Deployment ==="
echo "Starting deployment at $(date)"

# Step 1: Pull latest from branch
echo ""
echo "[Step 1/5] Pulling latest from branch: ${BRANCH}"
cd "${PROJECT_DIR}"
git checkout "${BRANCH}" || {
    echo "ERROR: Failed to checkout branch ${BRANCH}"
    exit 1
}
git pull origin "${BRANCH}" || {
    echo "ERROR: Failed to pull latest changes"
    exit 1
}
echo "✓ Code pulled successfully"

# Step 2: Build the plugin
echo ""
echo "[Step 2/5] Building plugin..."
cd "${PROJECT_DIR}/src/hell-plugin"
npm install || {
    echo "ERROR: Failed to install dependencies"
    exit 1
}
npm run build || {
    echo "ERROR: Failed to build plugin"
    exit 1
}
echo "✓ Plugin built successfully"

# Step 3: Restart pm2 process
echo ""
echo "[Step 3/5] Restarting pm2 process..."
cd "${PROJECT_DIR}"

# Check if pm2 is running
if ! pm2 describe hell-factory-monitoring >/dev/null 2>&1; then
    echo "Starting fresh pm2 process..."
    pm2 start ops/pm2/ecosystem.config.js || {
        echo "ERROR: Failed to start pm2 process"
        exit 1
    }
else
    echo "Restarting existing pm2 process..."
    pm2 restart hell-factory-monitoring || {
        echo "ERROR: Failed to restart pm2 process"
        exit 1
    }
fi

echo "✓ PM2 process restarted"

# Step 4: Wait for startup and check health
echo ""
echo "[Step 4/5] Waiting for plugin to start..."
sleep "${HEALTH_TIMEOUT}"

echo "Checking health endpoint: ${HEALTH_URL}"

RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "${HEALTH_URL}" >/dev/null 2>&1; then
        echo "✓ Health check passed"
        HEALTH_RESPONSE=$(curl -s "${HEALTH_URL}")
        echo "Health response: ${HEALTH_RESPONSE}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Health check failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 2
        else
            echo "ERROR: Health check failed after $MAX_RETRIES attempts"
            echo "PM2 logs:"
            pm2 logs hell-factory-monitoring --lines 20 --nostream
            exit 1
        fi
    fi
done

# Step 5: Report status
echo ""
echo "[Step 5/5] Deployment complete!"
echo ""
echo "=== Status Summary ==="
pm2 status | grep hell-factory-monitoring || echo "Process not found in status"
echo ""
echo "=== Recent Logs ==="
pm2 logs hell-factory-monitoring --lines 10 --nostream
echo ""
echo "=== Deployment successful at $(date) ==="

# Optional: Report to Discord (commented out - needs webhook URL)
# WEBHOOK_URL="YOUR_DISCORD_WEBHOOK_URL"
# if [ -n "$WEBHOOK_URL" ]; then
#     curl -X POST "${WEBHOOK_URL}" \
#         -H "Content-Type: application/json" \
#         -d "{\"content\": \"✅ Hell Factory Monitoring deployed successfully at $(date)\"}"
# fi

exit 0
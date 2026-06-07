#!/bin/bash
# Deployment script for Hell Factory nginx configuration
# This script adds the hell-factory location blocks to the main nginx site

set -e

echo "=== Hell Factory Nginx Deployment ==="
echo ""

# Configuration
NGINX_CONF_DIR="/etc/nginx"
MAIN_SITE_CONF="${NGINX_CONF_DIR}/sites-available/9443-main.conf"  # Adjust if needed
HELL_FACTORY_CONF="/home/bunditm/projects/hell-factory/ops/nginx/hell-factory.conf"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run with sudo"
    echo "Usage: sudo $0"
    exit 1
fi

# Step 1: Find the main nginx site that listens on :9443
echo "Step 1: Finding nginx configuration for port 9443..."
MAIN_CONF=""
for conf_file in ${NGINX_CONF_DIR}/sites-enabled/*; do
    if grep -q "listen.*9443" "$conf_file" 2>/dev/null; then
        MAIN_CONF="$conf_file"
        echo "Found: $conf_file"
        break
    fi
done

if [ -z "$MAIN_CONF" ]; then
    echo "Error: Could not find nginx configuration for port 9443"
    echo "Available site configs:"
    ls -la ${NGINX_CONF_DIR}/sites-enabled/
    exit 1
fi

# Step 2: Backup the existing configuration
echo ""
echo "Step 2: Backing up existing configuration..."
BACKUP_FILE="${MAIN_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$MAIN_CONF" "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Step 3: Check if hell-factory location blocks already exist
if grep -q "location /hell-factory/" "$MAIN_CONF"; then
    echo ""
    echo "Warning: Hell Factory location blocks already exist in $MAIN_CONF"
    read -p "Do you want to replace them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. No changes made."
        exit 0
    fi
    # Remove existing hell-factory blocks
    echo "Removing existing hell-factory location blocks..."
    # Using sed to remove between location markers (simplistic approach)
    sed -i '/# Hell Factory/,/^}/d' "$MAIN_CONF" 2>/dev/null || true
fi

# Step 4: Append the hell-factory configuration
echo ""
echo "Step 3: Adding Hell Factory configuration..."
echo "" >> "$MAIN_CONF"
echo "# Hell Factory configuration" >> "$MAIN_CONF"
echo "# Added by ops/nginx/DEPLOY-NGINX.sh" >> "$MAIN_CONF"
echo "" >> "$MAIN_CONF"
cat "$HELL_FACTORY_CONF" >> "$MAIN_CONF"

# Step 5: Test nginx configuration
echo ""
echo "Step 4: Testing nginx configuration..."
if nginx -t; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration test failed"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$MAIN_CONF"
    exit 1
fi

# Step 6: Reload nginx
echo ""
echo "Step 5: Reloading nginx..."
if systemctl reload nginx; then
    echo "✓ Nginx reloaded successfully"
else
    echo "✗ Nginx reload failed"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$MAIN_CONF"
    systemctl reload nginx
    exit 1
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Configuration file: $MAIN_CONF"
echo "Backup file: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "1. Verify HTTP route: curl -i https://localhost:9443/hell-factory/"
echo "2. Verify SSE route: curl -N https://localhost:9443/hell-factory/api/sse"
echo ""
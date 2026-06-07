#!/bin/bash
# Quick deployment script for Hell Factory on port 9443
# This creates a standalone nginx site configuration

set -e

echo "=== Hell Factory Nginx Quick Deployment ==="
echo ""

NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
CONF_FILE="${NGINX_SITES_AVAILABLE}/9443-hell-factory.conf"
SOURCE_CONF="/home/bunditm/projects/hell-factory/ops/nginx/9443-hell-factory.conf"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run with sudo"
    echo "Usage: sudo $0"
    exit 1
fi

# Step 1: Copy configuration
echo "Step 1: Copying nginx configuration..."
cp "$SOURCE_CONF" "$CONF_FILE"
echo "✓ Copied to $CONF_FILE"

# Step 2: Create symlink in sites-enabled
echo ""
echo "Step 2: Enabling site..."
ln -sf "$CONF_FILE" "${NGINX_SITES_ENABLED}/9443-hell-factory.conf"
echo "✓ Symlink created"

# Step 3: Test configuration
echo ""
echo "Step 3: Testing nginx configuration..."
if nginx -t; then
    echo "✓ Configuration is valid"
else
    echo "✗ Configuration test failed"
    echo "Removing configuration..."
    rm "$CONF_FILE"
    rm "${NGINX_SITES_ENABLED}/9443-hell-factory.conf"
    exit 1
fi

# Step 4: Reload nginx
echo ""
echo "Step 4: Reloading nginx..."
if systemctl reload nginx; then
    echo "✓ Nginx reloaded successfully"
else
    echo "✗ Nginx reload failed"
    exit 1
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Configuration: $CONF_FILE"
echo "URL: https://<vps>:9443/hell-factory/"
echo ""
echo "Test with:"
echo "  curl -i https://localhost:9443/hell-factory/ -k"
echo "  curl -N https://localhost:9443/hell-factory/api/sse -k"
echo ""
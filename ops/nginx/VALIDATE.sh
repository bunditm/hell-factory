#!/bin/bash
# Validation script to test hell-factory configuration without deployment
# This checks that services are running and ports are accessible

set -e

echo "=== Hell Factory Pre-Deployment Validation ==="
echo ""

PASSED=0
FAILED=0

# Check if port 3001 is listening (Next.js app)
echo "Checking Next.js app (port 3001)..."
if netstat -tuln 2>/dev/null | grep -q ":3001 " || ss -tuln 2>/dev/null | grep -q ":3001 "; then
    echo "  ✓ Port 3001 is listening"
    ((PASSED++))
else
    echo "  ✗ Port 3001 is NOT listening"
    echo "    Start the Next.js app: npm run dev"
    ((FAILED++))
fi
echo ""

# Check if port 3002 is listening (SSE server)
echo "Checking SSE server (port 3002)..."
if netstat -tuln 2>/dev/null | grep -q ":3002 " || ss -tuln 2>/dev/null | grep -q ":3002 "; then
    echo "  ✓ Port 3002 is listening"
    ((PASSED++))
else
    echo "  ✗ Port 3002 is NOT listening"
    echo "    Note: SSE server may not be running yet (backend-dev task)"
    echo "    This is OK for deployment, but SSE tests will be skipped"
fi
echo ""

# Check if nginx is running
echo "Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "  ✓ Nginx is running"
    ((PASSED++))
else
    echo "  ✗ Nginx is NOT running"
    echo "    Start nginx: sudo systemctl start nginx"
    ((FAILED++))
fi
echo ""

# Check if port 9443 is listening
echo "Checking nginx port 9443..."
if netstat -tuln 2>/dev/null | grep -q ":9443 " || ss -tuln 2>/dev/null | grep -q ":9443 "; then
    echo "  ✓ Port 9443 is listening"
    ((PASSED++))
else
    echo "  ✗ Port 9443 is NOT listening"
    echo "    Nginx may not be configured for port 9443 yet"
fi
echo ""

# Check if SSL certificates exist
echo "Checking SSL certificates..."
if [ -f "/etc/ssl/cloudflare/allhoro.com.pem" ] && [ -f "/etc/ssl/cloudflare/allhoro.com.key" ]; then
    echo "  ✓ SSL certificates found"
    ((PASSED++))
else
    echo "  ✗ SSL certificates NOT found"
    echo "    Expected: /etc/ssl/cloudflare/allhoro.com.pem"
    echo "    Update 9443-hell-factory.conf with correct SSL paths"
    ((FAILED++))
fi
echo ""

# Check configuration files exist
echo "Checking configuration files..."
CONF_DIR="/home/bunditm/projects/hell-factory/ops/nginx"
if [ -f "$CONF_DIR/hell-factory.conf" ]; then
    echo "  ✓ hell-factory.conf exists"
    ((PASSED++))
else
    echo "  ✗ hell-factory.conf NOT found"
    ((FAILED++))
fi

if [ -f "$CONF_DIR/9443-hell-factory.conf" ]; then
    echo "  ✓ 9443-hell-factory.conf exists"
    ((PASSED++))
else
    echo "  ✗ 9443-hell-factory.conf NOT found"
    ((FAILED++))
fi

if [ -f "$CONF_DIR/QUICK-DEPLOY.sh" ]; then
    echo "  ✓ QUICK-DEPLOY.sh exists"
    ((PASSED++))
else
    echo "  ✗ QUICK-DEPLOY.sh NOT found"
    ((FAILED++))
fi
echo ""

# Final report
echo "=== Validation Summary ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo "✓ All critical checks passed!"
    echo ""
    echo "Ready to deploy:"
    echo "  cd /home/bunditm/projects/hell-factory/ops/nginx"
    echo "  sudo ./QUICK-DEPLOY.sh"
    exit 0
else
    echo "✗ Some checks failed - fix issues before deploying"
    exit 1
fi
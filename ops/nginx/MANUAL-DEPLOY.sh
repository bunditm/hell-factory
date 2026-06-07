#!/bin/bash
# Manual deployment steps for when sudo password is required
# Run each command manually with sudo

echo "=== Manual Hell Factory Nginx Deployment ==="
echo ""
echo "Run these commands one at a time (each requires sudo password):"
echo ""

echo "1. Copy configuration to nginx sites-available:"
echo "   sudo cp /home/bunditm/projects/hell-factory/ops/nginx/9443-hell-factory.conf /etc/nginx/sites-available/"
echo ""

echo "2. Create symlink in sites-enabled:"
echo "   sudo ln -s /etc/nginx/sites-available/9443-hell-factory.conf /etc/nginx/sites-enabled/9443-hell-factory.conf"
echo ""

echo "3. Test nginx configuration:"
echo "   sudo nginx -t"
echo ""

echo "4. Reload nginx:"
echo "   sudo systemctl reload nginx"
echo ""

echo "5. Verify nginx reloaded:"
echo "   sudo systemctl status nginx"
echo ""

echo "6. Verify port 9443 is listening:"
echo "   sudo netstat -tuln | grep 9443"
echo "   # or: sudo ss -tuln | grep 9443"
echo ""

echo "7. Test HTTP route (after deployment):"
echo "   curl -i https://localhost:9443/hell-factory/ -k"
echo ""

echo "8. Test SSE route (after backend-dev starts SSE server on port 3002):"
echo "   curl -N https://localhost:9443/hell-factory/api/sse -k"
echo ""

echo "=== Rollback (if needed) ==="
echo "If something goes wrong, revert:"
echo ""
echo "1. Remove configuration:"
echo "   sudo rm /etc/nginx/sites-enabled/9443-hell-factory.conf"
echo "   sudo rm /etc/nginx/sites-available/9443-hell-factory.conf"
echo ""

echo "2. Reload nginx:"
echo "   sudo systemctl reload nginx"
echo ""
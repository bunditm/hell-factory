# Hell Factory Nginx Configuration

This directory contains the nginx reverse-proxy configuration for Hell Factory.

## Files

- `hell-factory.conf` - The nginx location blocks for Hell Factory
- `DEPLOY-NGINX.sh` - Deployment script (requires sudo)
- `TEST-NGINX.sh` - Test suite (requires sudo)
- `README.md` - This file

## Configuration Details

### Routes

1. **Main Application**: `/hell-factory/` → `http://127.0.0.1:3001/`
   - Next.js application
   - Standard proxy headers
   - WebSocket support (for dev mode)

2. **SSE Endpoint**: `/hell-factory/api/sse` → `http://127.0.0.1:3002/events`
   - Server-Sent Events for real-time monitoring
   - **CRITICAL**: No buffering enabled
   - Long read timeout (24 hours)
   - Cache-Control headers to prevent caching

3. **Health Check**: `/hell-factory/api/health` → `http://127.0.0.1:3002/health`
   - Optional endpoint for monitoring
   - Returns plugin status

### SSE-Specific Settings

The SSE endpoint has special configuration to ensure real-time streaming works correctly:

```nginx
proxy_buffering off;           # Disable response buffering
proxy_cache off;               # Disable caching
proxy_request_buffering off;   # Disable request buffering
proxy_read_timeout 86400s;     # 24-hour timeout for SSE connections
proxy_set_header Connection ''; # Disable HTTP keep-alive upgrades
```

**Why this matters**: Without these settings, nginx will buffer SSE events and break real-time monitoring. Events would arrive in batches instead of streaming incrementally.

## Deployment

### Option 1: Quick Standalone Deployment (Recommended)

This creates a new nginx site that listens on port 9443:

```bash
cd /home/bunditm/projects/hell-factory/ops/nginx
sudo ./QUICK-DEPLOY.sh
```

The script will:
1. Copy `9443-hell-factory.conf` to `/etc/nginx/sites-available/`
2. Create symlink in `/etc/nginx/sites-enabled/`
3. Test the configuration with `nginx -t`
4. Reload nginx with `systemctl reload nginx`

This is the easiest approach and won't interfere with existing configurations.

### Option 2: Automated Deployment to Existing Site

If you want to add hell-factory to an existing nginx site:

```bash
cd /home/bunditm/projects/hell-factory/ops/nginx
sudo ./DEPLOY-NGINX.sh
```

The script will:
1. Find the nginx site configuration that listens on port 9443
2. Create a backup of the existing configuration
3. Append the hell-factory location blocks
4. Test the configuration with `nginx -t`
5. Reload nginx with `systemctl reload nginx`

### Option 2: Manual Deployment

1. Find the nginx site that listens on port 9443:
   ```bash
   grep -r "listen.*9443" /etc/nginx/sites-enabled/
   ```

2. Edit the configuration file and append the contents of `hell-factory.conf`

3. Test the configuration:
   ```bash
   sudo nginx -t
   ```

4. Reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## Testing

Run the test suite (requires sudo):

```bash
cd /home/bunditm/projects/hell-factory/ops/nginx
sudo ./TEST-NGINX.sh
```

The test suite checks:
1. Nginx configuration is valid
2. HTTP route returns 200
3. SSE route returns correct headers (text/event-stream)
4. No buffering (events stream incrementally)

### Manual Testing

**Test HTTP route:**
```bash
curl -i https://localhost:9443/hell-factory/ -k
```
Expected: 200 OK response with Next.js HTML

**Test SSE route:**
```bash
curl -N https://localhost:9443/hell-factory/api/sse -k
```
Expected: `Content-Type: text/event-stream` header, events streaming in real-time

**Test health check:**
```bash
curl https://localhost:9443/hell-factory/api/health -k
```
Expected: JSON status response

## Troubleshooting

### SSE events not streaming

If SSE events are buffered (arrive in batches instead of streaming):

1. Check nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Verify these settings are present in the SSE location block:
   ```nginx
   proxy_buffering off;
   proxy_cache off;
   proxy_request_buffering off;
   proxy_read_timeout 86400s;
   ```

3. Test with verbose curl to see buffering behavior:
   ```bash
   curl -v https://localhost:9443/hell-factory/api/sse -k -N --max-time 10
   ```

### 502 Bad Gateway

If you see 502 errors:

1. Check if the Next.js app is running:
   ```bash
   curl http://127.0.0.1:3001/
   ```

2. Check if the SSE server is running:
   ```bash
   curl http://127.0.0.1:3002/health
   ```

3. Check nginx error logs for specific error messages

### Configuration not loading

If nginx doesn't seem to load the new configuration:

1. Check if the location blocks are in the correct server block
2. Verify the configuration is in a file in `/etc/nginx/sites-enabled/`
3. Check for syntax errors: `sudo nginx -t`
4. Reload nginx explicitly: `sudo systemctl reload nginx`

## References

- Monitoring requirements: `/home/bunditm/projects/hell-factory/docs/06-monitoring-requirements.md` §M4
- Architecture: `/home/bunditm/projects/hell-factory/docs/03-architecture.md`

## Notes

- The configuration is designed for the same VPS that hosts Hermes
- Port 9443 should already be configured for HTTPS with SSL certificates
- The SSE server must bind to `127.0.0.1:3002` only (per security requirements)
- Nginx routes `/hell-factory/` requests from the outside world to the internal services
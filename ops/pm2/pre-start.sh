#!/bin/bash
# Pre-start hook for hell-factory-monitoring
# Ensures SSE port 3002 is free before starting

SSE_PORT=${SSE_PORT:-3002}
SSE_HOST=${SSE_HOST:-127.0.0.1}

echo "[pre-start] Checking if port ${SSE_HOST}:${SSE_PORT} is free..."

# Check if anything is listening on the port
PID=$(lsof -ti:${SSE_PORT} 2>/dev/null)

if [ -n "$PID" ]; then
    echo "[pre-start] Port ${SSE_PORT} is in use by PID $PID"
    echo "[pre-start] Killing stale process..."

    # Try graceful kill first
    kill $PID 2>/dev/null
    sleep 2

    # Check if it's still running and force kill if needed
    if kill -0 $PID 2>/dev/null; then
        echo "[pre-start] Process still running, force killing..."
        kill -9 $PID 2>/dev/null
        sleep 1
    fi

    # Verify port is now free
    if lsof -ti:${SSE_PORT} >/dev/null 2>&1; then
        echo "[pre-start] ERROR: Port ${SSE_PORT} still in use after kill attempt"
        exit 1
    fi

    echo "[pre-start] Port ${SSE_PORT} is now free"
else
    echo "[pre-start] Port ${SSE_PORT} is free"
fi

# Verify binding to 127.0.0.1 only (security check)
if [ "${SSE_HOST}" != "127.0.0.1" ] && [ "${SSE_HOST}" != "::1" ]; then
    echo "[pre-start] SECURITY ERROR: SSE_HOST must be 127.0.0.1 or ::1, got ${SSE_HOST}"
    exit 1
fi

echo "[pre-start] Pre-start checks passed"
exit 0
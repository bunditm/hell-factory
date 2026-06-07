#!/bin/bash
# Test script for Hell Factory nginx configuration
# Tests (a) nginx config validates, (b) HTTP route works, (c) SSE route works, (d) no buffering

set -e

echo "=== Hell Factory Nginx Test Suite ==="
echo ""

PASSED=0
FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    local expected="$3"
    
    echo "Testing: $test_name"
    if eval "$test_cmd" | grep -q "$expected"; then
        echo "  ✓ PASSED"
        ((PASSED++))
    else
        echo "  ✗ FAILED"
        ((FAILED++))
    fi
    echo ""
}

# Test 1: Nginx configuration validates
echo "--- Test 1: Nginx configuration validates ---"
if sudo nginx -t 2>&1 | grep -q "successful\|syntax is ok"; then
    echo "  ✓ PASSED"
    ((PASSED++))
else
    echo "  ✗ FAILED"
    ((FAILED++))
fi
echo ""

# Check if services are running
echo "Checking if services are running..."
if ! curl -s http://127.0.0.1:3001/ > /dev/null 2>&1; then
    echo "Warning: Next.js app (port 3001) is not running"
    echo "Skipping HTTP route tests..."
    echo ""
elif ! curl -s http://127.0.0.1:3002/health > /dev/null 2>&1; then
    echo "Warning: SSE server (port 3002) is not running"
    echo "Skipping SSE route tests..."
    echo ""
else
    # Test 2: HTTP route returns 200 or appropriate Next.js response
    echo "--- Test 2: HTTP route works ---"
    HTTP_RESPONSE=$(curl -i -s https://localhost:9443/hell-factory/ -k 2>&1 || echo "FAILED")
    if echo "$HTTP_RESPONSE" | grep -q "HTTP.*200\|Next.js\|text/html"; then
        echo "  ✓ PASSED"
        ((PASSED++))
    else
        echo "  ✗ FAILED"
        echo "  Response: $(echo "$HTTP_RESPONSE" | head -5)"
        ((FAILED++))
    fi
    echo ""

    # Test 3: SSE route returns correct headers
    echo "--- Test 3: SSE route returns correct headers ---"
    SSE_RESPONSE=$(curl -i -s https://localhost:9443/hell-factory/api/sse -k -N --max-time 2 2>&1 || echo "FAILED")
    if echo "$SSE_RESPONSE" | grep -qi "text/event-stream\|content-type:.*event-stream"; then
        echo "  ✓ PASSED"
        ((PASSED++))
    else
        echo "  ✗ FAILED"
        echo "  Response: $(echo "$SSE_RESPONSE" | head -10)"
        ((FAILED++))
    fi
    echo ""

    # Test 4: No buffering (data streams incrementally)
    echo "--- Test 4: No buffering (data streams incrementally) ---"
    # This test checks if SSE events arrive within a reasonable time window
    # We expect to see events arriving within 2 seconds (not all at once at the end)
    START_TIME=$(date +%s%N)
    EVENTS_RECEIVED=0
    
    # Stream for 3 seconds and count events
    timeout 3s curl -s https://localhost:9443/hell-factory/api/sse -k -N 2>/dev/null | \
        while IFS= read -r line; do
            CURRENT_TIME=$(date +%s%N)
            ELAPSED=$(( (CURRENT_TIME - START_TIME) / 1000000 ))
            
            # Count events (lines starting with "data:" or "event:")
            if echo "$line" | grep -qE "^(data:|event:|id:|retry:)"; then
                ((EVENTS_RECEIVED++))
                echo "  Event at ${ELAPSED}ms: ${line:0:50}"
            fi
            
            # If we've seen at least 3 events spread over 1+ second, buffering is disabled
            if [ "$EVENTS_RECEIVED" -ge 3 ] && [ "$ELAPSED" -gt 500 ]; then
                echo "  ✓ PASSED - Events streaming incrementally"
                exit 0
            fi
        done || echo "  ✗ FAILED - Events may be buffered"
    echo ""
fi

# Final report
echo "=== Test Summary ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
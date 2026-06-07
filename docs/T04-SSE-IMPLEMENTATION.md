# T04: SSE Server Implementation Summary

## Task Completion

Implemented the SSE (Server-Sent Events) server for streaming Hermes agent status updates to the browser, per FR-M4 requirements.

## Files Created/Modified

### New Files
1. **src/sse.ts** (266 lines) - SSEServer class implementation
   - Wraps express for SSE endpoint
   - Subscribes to AgentStateAggregator for state changes
   - Sends state_snapshot on connect, agent_update on changes, heartbeat every 5s, agent_removed on cleanup
   - Enforces 127.0.0.1 binding (throws on 0.0.0.0)
   - Caps concurrent connections to 5 (returns 503 for excess)

2. **tests/sse.test.ts** (105 lines) - Unit tests for SSEServer
   - 9 tests covering security, lifecycle, connection management, integration

3. **tests/sse-integration.test.ts** (121 lines) - Integration tests
   - 5 tests covering actual SSE streaming, event structure, health endpoint

### Modified Files
4. **src/index.ts** - Integrated SSEServer into plugin activation
   - Instantiate AgentStateAggregator
   - Instantiate and start SSEServer
   - Start health endpoint on port+1
   - Poll aggregator.tick() every 500ms
   - Clean shutdown of SSEServer

## Implementation Details

### SSE Event Types (per M4)
- `state_snapshot` - Full state on connect: `{ agents: HermesAgentStatus[], emittedAt }`
- `agent_update` - Full status object on change (not JSON Patch, per FR-M4.4)
- `agent_removed` - `{ agentId }` when agent no longer tracked
- `heartbeat` - Every 5s: `{ at, connectedClients }`

### Security (FR-M4.1, FR-M9.1)
- Constructor throws if host is '0.0.0.0' or '::'
- Runtime check verifies bound address matches requested host
- Bind only to 127.0.0.1:3002 (health endpoint on 3003)

### Connection Management (FR-M9.2)
- Max 5 concurrent connections (configurable)
- Excess connections get 503 status
- Automatic cleanup on disconnect
- Client counter exposed via getConnectedClientCount()

### Event Streaming (FR-M4.3, FR-M4.4, FR-M4.7)
- First event on connect is always state_snapshot
- Delta tracking: only send agent_update when status changes
- Full HermesAgentStatus object sent (not JSON Patch)
- Subscribe/unsubscribe properly managed
- No blocking operations in event path

## Tests Passing

### SSEServer Unit Tests (9/9 passed)
- ✓ Throws on 0.0.0.0 binding
- ✓ Throws on :: binding
- ✓ Successfully binds to 127.0.0.1
- ✓ Start and stop cleanly
- ✓ Tracks connected client count
- ✓ Enforces max connections limit
- ✓ Subscribes to aggregator
- ✓ Uses default configuration
- ✓ Accepts custom configuration

### SSE Integration Tests (5/5 passed)
- ✓ Responds to GET /events with correct headers
- ✓ Returns streaming response
- ✓ Sends state_snapshot as first event
- ✓ Health endpoint returns correct shape
- ✓ Plugin metadata is correct

**Total: 14/14 SSE-related tests passing**

## Verification

### Build
```bash
npm run build  # ✅ Success
```

### Run SSE tests
```bash
npm test -- tests/sse.test.ts tests/sse-integration.test.ts  # ✅ All pass
```

### Manual verification (optional)
```bash
# Activate plugin
cd src/hell-plugin
node -e "import('./dist/index.js').then(m => m.activate({hermesHome: process.env.HOME || '~/.hermes'}))"

# In another terminal:
curl http://127.0.0.1:3002/events
# Should see: event: state_snapshot\ndata: {"agents":[...],"emittedAt":...}\n\n

# Wait 5s for heartbeat
# Should see: event: heartbeat\ndata: {"at":...,"connectedClients":1}\n\n
```

## Open Items

1. **Port conflicts in test suite** - Multiple test suites trying to use same ports simultaneously. This is a test infrastructure issue, not an implementation bug. Running tests individually works fine.

2. **State test failures** - 4 failures in state.test.ts (from T03) unrelated to SSE implementation. These should be addressed in T03.

## Next Steps

T06: Event bus integration for real-time state change events (state_change, approval_request, sub_agent_spawned, sub_agent_completed)
'use client'

import { Component, ReactNode } from 'react'
import { useSseStatus } from '../../../lib/monitoring/sseClient'
import { useMonitoringStore } from '../../../lib/monitoring/monitoringStore'

interface SseErrorBoundaryProps {
  children: ReactNode
}

interface SseErrorBoundaryState {
  hasError: boolean
  error: Error | null
  showReportModal: boolean
}

/**
 * React Error Boundary for SSE handling
 * Catches errors from SSE parsing, store updates, and monitoring slice
 * Shows a graceful overlay with reconnect UX per FR-M12
 */
export class SseErrorBoundary extends Component<SseErrorBoundaryProps, SseErrorBoundaryState> {
  constructor(props: SseErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      showReportModal: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<SseErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log sanitized error (no PII, only structural fields)
    console.error('[SseErrorBoundary] SSE error caught:', {
      errorName: error.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
    })

    // Don't log full event payloads - they may contain sensitive data
    // Only log that an error occurred (FR-M12.3)
  }

  // Reset error state for manual retry
  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  // Toggle report modal
  toggleReportModal = () => {
    this.setState(prev => ({ showReportModal: !prev.showReportModal }))
  }

  render() {
    if (this.state.hasError) {
      return <SseErrorOverlay error={this.state.error} onRetry={this.handleRetry} onShowReport={this.toggleReportModal} showReportModal={this.state.showReportModal} />
    }

    return this.props.children
  }
}

/**
 * Inner functional component for SSE status + UI overlay
 * Uses hooks for SSE status and store access
 */
function SseErrorOverlay({ error, onRetry, onShowReport, showReportModal }: {
  error: Error | null
  onRetry: () => void
  onShowReport: () => void
  showReportModal: boolean
}) {
  const sseStatus = useSseStatus()
  const connectionState = useMonitoringStore(state => state.connectionState)
  
  const isReconnecting = sseStatus.connectionState === 'reconnecting' || connectionState === 'reconnecting'
  const isError = sseStatus.connectionState === 'error' || error !== null

  // Show reconnect UI during reconnect attempts
  if (isReconnecting && !isError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-amber-500 text-lg font-semibold">
            Monitoring connection error. Reconnecting...
          </div>
          <div className="text-amber-700 text-sm mt-2">
            Attempt {sseStatus.reconnectAttempts} of 10
          </div>
        </div>
      </div>
    )
  }

  // Show error overlay on parse error or SSE error
  if (isError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
        <div className="text-center max-w-md px-6">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <div className="text-red-500 text-xl font-semibold mb-2">
            Monitoring connection error
          </div>
          <div className="text-amber-500 text-sm mb-6">
            {error?.message || 'Failed to connect to monitoring stream'}
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
            >
              Retry connection
            </button>
            
            <button
              onClick={onShowReport}
              className="px-6 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded-lg font-medium transition-colors border border-red-700"
            >
              Report issue
            </button>
          </div>
          
          {showReportModal && <IssueReportModal onClose={onShowReport} />}
        </div>
      </div>
    )
  }

  return null
}

/**
 * Issue report modal per FR-M12.4
 * Captures last 10 events + browser/OS metadata
 */
function IssueReportModal({ onClose }: { onClose: () => void }) {
  // Get recent events from store (if available)
  const agents = useMonitoringStore(state => state.agents)
  const lastSnapshotAt = useMonitoringStore(state => state.lastSnapshotAt)
  const lastHeartbeatAt = useMonitoringStore(state => state.lastHeartbeatAt)
  
  // Browser/OS metadata
  const browserInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
  }

  // Capture last 10 agents (as proxy for recent events)
  // In production, the SSE client should expose a ring buffer of events
  const recentAgents = Array.from(agents.values()).slice(0, 10)

  const handleReport = () => {
    const reportData = {
      browser: browserInfo,
      monitoring: {
        agentCount: agents.size,
        lastSnapshotAt,
        lastHeartbeatAt,
        recentAgents: recentAgents.map(a => ({
          agentId: a.agentId,
          state: a.state,
          lastActivityAt: a.lastActivityAt,
        })),
      },
      timestamp: Date.now(),
    }

    console.log('[SseErrorBoundary] Issue report:', reportData)
    
    // In production, this would send to a bug tracker or backend endpoint
    // For now, log and notify user
    alert('Issue report captured (see console for details). Report this to the dev team.')
    onClose()
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-60" onClick={onClose}>
      <div className="bg-gray-900 border border-amber-600 rounded-lg p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-amber-500 text-lg font-semibold mb-4">Report Issue</h3>
        
        <div className="text-gray-300 text-sm mb-4 space-y-2">
          <div>
            <span className="text-gray-500">Browser:</span> {browserInfo.userAgent}
          </div>
          <div>
            <span className="text-gray-500">Platform:</span> {browserInfo.platform}
          </div>
          <div>
            <span className="text-gray-500">Agents tracked:</span> {agents.size}
          </div>
          <div>
            <span className="text-gray-500">Last heartbeat:</span> {lastHeartbeatAt ? new Date(lastHeartbeatAt).toISOString() : 'Never'}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReport}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex-1"
          >
            Send Report
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
/**
 * useWebSocket Hook
 * TRS Section 7: WebSocket subscription for real-time optimization events
 * 
 * Features:
 * - WebSocket channel /ws/optimisation-events (simulated with ~15s intervals)
 * - Real-time event handling for production monitoring
 * - Automatic reconnection and error handling
 * - Cache invalidation on relevant events
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface OptimisationEvent {
  id: string
  type: 'new_optimisation' | 'optimisation_update' | 'system_alert' | 'performance_change'
  timestamp: string
  data: Record<string, unknown>
  priority: 'low' | 'medium' | 'high' | 'critical'
  affectedAssets?: ('east' | 'west')[]
  message?: string
}

interface UseWebSocketOptions {
  /** Enable/disable WebSocket connection (default: true) */
  enabled?: boolean
  /** WebSocket URL (default: from environment or fallback to mock) */
  url?: string
  /** Reconnection options */
  reconnect?: {
    enabled: boolean
    maxAttempts: number
    delay: number
  }
}

interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  lastEvent: OptimisationEvent | null
  events: OptimisationEvent[]
  error: Error | null
}

/**
 * WebSocket hook for real-time optimization events
 * TRS Section 7: Simulates push events every ~15s
 */
export const useWebSocket = (options: UseWebSocketOptions = {}): WebSocketState & {
  reconnect: () => void
  clearEvents: () => void
} => {
  const {
    enabled = true,
    url = process.env.VITE_WS_URL || 'ws://localhost:5173/ws/optimisation-events',
    reconnect: reconnectOptions = {
      enabled: true,
      maxAttempts: 5,
      delay: 3000,
    },
  } = options

  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    lastEvent: null,
    events: [],
    error: null,
  })

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const optimisationEvent: OptimisationEvent = JSON.parse(event.data)
      
      setState(prev => ({
        ...prev,
        lastEvent: optimisationEvent,
        events: [...prev.events.slice(-99), optimisationEvent], // Keep last 100 events
        error: null,
      }))

      // TRS Section 7: Cache invalidation based on event type
      switch (optimisationEvent.type) {
        case 'new_optimisation':
        case 'optimisation_update':
          queryClient.invalidateQueries({ queryKey: ['optimisations'] })
          break
        case 'system_alert':
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
          queryClient.invalidateQueries({ queryKey: ['summary'] })
          break
        case 'performance_change':
          queryClient.invalidateQueries({ queryKey: ['summary'] })
          queryClient.invalidateQueries({ queryKey: ['nodes'] })
          break
      }

      // Asset-specific cache invalidation
      if (optimisationEvent.affectedAssets) {
        optimisationEvent.affectedAssets.forEach(asset => {
          queryClient.invalidateQueries({ 
            queryKey: ['summary', 'asset', asset] 
          })
          queryClient.invalidateQueries({ 
            queryKey: ['optimisations', 'asset', asset] 
          })
        })
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
      setState(prev => ({
        ...prev,
        error: new Error('Failed to parse WebSocket message'),
      }))
    }
  }, [queryClient])

  // Handle WebSocket connection opening
  const handleOpen = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      error: null,
    }))
    reconnectAttempts.current = 0
  }, [])

  // Handle WebSocket connection closing
  const handleClose = useCallback((event: CloseEvent) => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: event.wasClean ? null : new Error(`WebSocket closed unexpectedly: ${event.reason}`),
    }))

    // Attempt reconnection if enabled and not a clean close
    if (reconnectOptions.enabled && !event.wasClean && reconnectAttempts.current < reconnectOptions.maxAttempts) {
      reconnectAttempts.current++
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, reconnectOptions.delay * reconnectAttempts.current)
    }
  }, [reconnectOptions])

  // Handle WebSocket errors
  const handleError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: new Error('WebSocket connection error'),
      isConnecting: false,
    }))
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }))

    try {
      // In development, use the mock WebSocket implementation
      if (process.env.NODE_ENV === 'development') {
        // TRS Section 7: Simulate WebSocket with mock events every ~15s
        startMockWebSocket()
      } else {
        wsRef.current = new WebSocket(url)
        wsRef.current.onopen = handleOpen
        wsRef.current.onmessage = handleMessage
        wsRef.current.onclose = handleClose
        wsRef.current.onerror = handleError
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isConnecting: false,
      }))
    }
  }, [enabled, url, handleOpen, handleMessage, handleClose, handleError])

  // Mock WebSocket implementation for development
  const startMockWebSocket = useCallback(() => {
    // Simulate connection
    setTimeout(() => {
      handleOpen()
    }, 1000)

    // TRS Section 7: Simulate push events every ~15s
    const mockInterval = setInterval(() => {
      const mockEvents: OptimisationEvent[] = [
        {
          id: `mock-${Date.now()}`,
          type: 'new_optimisation',
          timestamp: new Date().toISOString(),
          priority: 'medium',
          affectedAssets: ['east'],
          message: 'New optimization opportunity identified in East Asset',
          data: { nodeId: 'east-well-001', potentialGain: 2500 }
        },
        {
          id: `mock-${Date.now()}-2`,
          type: 'performance_change',
          timestamp: new Date().toISOString(),
          priority: 'low',
          affectedAssets: ['west'],
          message: 'Production efficiency improved in West Asset',
          data: { previousEfficiency: 94.2, currentEfficiency: 94.8 }
        },
        {
          id: `mock-${Date.now()}-3`,
          type: 'system_alert',
          timestamp: new Date().toISOString(),
          priority: 'high',
          message: 'Terminal inventory approaching export threshold',
          data: { currentInventory: 2800000, threshold: 3000000 }
        }
      ]

      // Randomly send one of the mock events
      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)]
      handleMessage({ data: JSON.stringify(randomEvent) } as MessageEvent)
    }, 15000) // TRS Section 7: ~15s intervals

    // Store the interval for cleanup
    wsRef.current = { close: () => clearInterval(mockInterval) } as WebSocket
  }, [handleMessage, handleOpen])

  // Manual reconnection function
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    reconnectAttempts.current = 0
    connect()
  }, [connect])

  // Clear events history
  const clearEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      events: [],
      lastEvent: null,
    }))
  }, [])

  // Effect to manage WebSocket connection
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [enabled, connect])

  return {
    ...state,
    reconnect,
    clearEvents,
  }
}

/**
 * Hook for high-priority optimization events only
 * Used for critical alerts that require immediate attention
 */
export const useHighPriorityEvents = (options: UseWebSocketOptions = {}) => {
  const websocket = useWebSocket(options)
  
  const highPriorityEvents = websocket.events.filter(
    event => event.priority === 'critical' || event.priority === 'high'
  )

  return {
    ...websocket,
    events: highPriorityEvents,
    lastEvent: websocket.lastEvent?.priority === 'critical' || websocket.lastEvent?.priority === 'high' 
      ? websocket.lastEvent 
      : null,
  }
} 
/**
 * WebSocket Mock Implementation
 * Following TRS Section 4 specifications
 * 
 * Simulates push events every ~15 seconds for:
 * - Optimization updates
 * - Constraint alerts  
 * - KPI updates
 * - System status changes
 */

import type {
  WebSocketMessage,
  WebSocketEventType,
  OptimisationAction,
  ConstraintEvent,
} from '../types/api';

// =============================================================================
// WEBSOCKET SIMULATION CLASS
// =============================================================================

export class WebSocketMock extends EventTarget {
  private isConnected = false;
  private intervalId: number | null = null;
  
  constructor(private url: string) {
    super();
  }

  /**
   * Simulate WebSocket connection
   */
  connect(): void {
    if (this.isConnected) {
      console.warn('WebSocket mock already connected');
      return;
    }

    console.log('🔌 WebSocket Mock: Connecting to', this.url);
    
    // Simulate connection delay
    setTimeout(() => {
      this.isConnected = true;
      this.dispatchEvent(new CustomEvent('open'));
      this.startEventSimulation();
      
      console.log('✅ WebSocket Mock: Connected');
    }, 100);
  }

  /**
   * Simulate WebSocket disconnection
   */
  disconnect(): void {
    if (!this.isConnected) {
      return;
    }

    this.isConnected = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.dispatchEvent(new CustomEvent('close'));
    console.log('🔌 WebSocket Mock: Disconnected');
  }

  /**
   * Send message (mock implementation)
   */
  send(data: string): void {
    if (!this.isConnected) {
      console.warn('WebSocket mock not connected');
      return;
    }

    console.log('📤 WebSocket Mock: Sending message', data);
    // In a real implementation, this would send to server
  }

  /**
   * Start simulating real-time events every ~15 seconds
   */
  private startEventSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Random interval between 12-18 seconds (average ~15s as per TRS)
    const scheduleNext = () => {
      const delay = 12000 + Math.random() * 6000; // 12-18 seconds
      
      setTimeout(() => {
        if (this.isConnected) {
          this.generateRandomEvent();
          scheduleNext(); // Schedule next event
        }
      }, delay);
    };

    scheduleNext();
  }

  /**
   * Generate random WebSocket events based on realistic scenarios
   */
  private generateRandomEvent(): void {
    const eventTypes: { type: WebSocketEventType; weight: number }[] = [
      { type: 'kpi_update', weight: 40 },
      { type: 'constraint_alert', weight: 25 },
      { type: 'optimisation_update', weight: 20 },
      { type: 'system_status', weight: 15 },
    ];

    // Weighted random selection
    const totalWeight = eventTypes.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedType: WebSocketEventType = 'kpi_update';
    for (const event of eventTypes) {
      random -= event.weight;
      if (random <= 0) {
        selectedType = event.type;
        break;
      }
    }

    const message = this.createEventMessage(selectedType);
    this.dispatchEvent(new CustomEvent('message', { detail: message }));
    
    console.log('📨 WebSocket Mock: Event generated', {
      type: selectedType,
      timestamp: message.timestamp
    });
  }

  /**
   * Create specific event messages based on type
   */
  private createEventMessage(type: WebSocketEventType): WebSocketMessage {
    const timestamp = new Date().toISOString();

    switch (type) {
      case 'optimisation_update':
        return {
          type,
          data: this.generateOptimisationUpdate(),
          timestamp,
        };

      case 'constraint_alert':
        return {
          type,
          data: this.generateConstraintAlert(),
          timestamp,
        };

      case 'kpi_update':
        return {
          type,
          data: this.generateKpiUpdate(),
          timestamp,
        };

      case 'system_status':
        return {
          type,
          data: this.generateSystemStatus(),
          timestamp,
        };

      default:
        return {
          type: 'system_status',
          data: { status: 'unknown_event' },
          timestamp,
        };
    }
  }

  // =========================================================================
  // EVENT DATA GENERATORS
  // =========================================================================

  private generateOptimisationUpdate(): { id: string; status: OptimisationAction['status']; lastUpdated: string } {
    const statuses = ['acknowledged', 'implementing', 'completed', 'rejected'];
    const actionIds = ['opt-001', 'opt-002', 'opt-003'];
    
    return {
      id: actionIds[Math.floor(Math.random() * actionIds.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)] as OptimisationAction['status'],
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateConstraintAlert(): Partial<ConstraintEvent> {
    const severities = ['info', 'warning', 'critical'];
    const nodeIds = ['well-001', 'flowline-001', 'facility-001', 'pipeline-001'];
    const eventTypes = ['pressure', 'temperature', 'flow', 'maintenance'];

    return {
      id: `constraint-${Date.now()}`,
      nodeId: nodeIds[Math.floor(Math.random() * nodeIds.length)],
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)] as ConstraintEvent['eventType'],
      severity: severities[Math.floor(Math.random() * severities.length)] as ConstraintEvent['severity'],
      description: 'Real-time constraint alert generated by WebSocket',
      timestamp: new Date().toISOString(),
    };
  }

  private generateKpiUpdate(): { id: string; throughput: { current: number; capacity: number; unit: string; efficiency: number }; lastUpdated: string } {
    const nodeIds = ['well-001', 'flowline-001', 'facility-001', 'pipeline-001'];
    const nodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    
    // Simulate small fluctuations in throughput
    const baseValue = 2000 + Math.random() * 13000; // 2000-15000 range
    const fluctuation = 0.95 + Math.random() * 0.1; // ±5% variation
    const current = Math.round(baseValue * fluctuation);
    
    return {
      id: nodeId,
      throughput: {
        current,
        capacity: Math.round(current * 1.2), // 20% above current
        unit: 'bbl/day',
        efficiency: Math.round((80 + Math.random() * 15) * 10) / 10, // 80-95%
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateSystemStatus(): object {
    const statuses = ['healthy', 'degraded', 'warning'];
    
    return {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      nodesOnline: 4 + Math.floor(Math.random() * 2), // 4-5 nodes
      totalNodes: 5,
      timestamp: new Date().toISOString(),
    };
  }
}

// =============================================================================
// HOOK-STYLE API FOR REACT INTEGRATION
// =============================================================================

/**
 * Create WebSocket mock instance for React hooks
 */
export const createWebSocketMock = (url: string): WebSocketMock => {
  const wsUrl = url.startsWith('/') ? `ws://localhost:5173${url}` : url;
  return new WebSocketMock(wsUrl);
};

/**
 * Default WebSocket mock for optimization events (TRS specified endpoint)
 */
export const createOptimisationWebSocket = (): WebSocketMock => {
  return createWebSocketMock('/ws/optimisation-events');
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse WebSocket message with type safety
 */
export const parseWebSocketMessage = <T = unknown>(event: MessageEvent | CustomEvent): WebSocketMessage<T> | null => {
  try {
    let data;
    
    if (event instanceof CustomEvent) {
      // Our mock events
      data = event.detail;
    } else if (typeof event.data === 'string') {
      // Real WebSocket events
      data = JSON.parse(event.data);
    } else {
      data = event.data;
    }

    // Validate message structure
    if (data && typeof data === 'object' && data.type && data.timestamp) {
      return data as WebSocketMessage<T>;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
    return null;
  }
};

/**
 * Security-ready message validation (placeholder for future implementation)
 */
export const validateWebSocketMessage = (message: WebSocketMessage): boolean => {
  // Basic validation for now
  if (!message.type || !message.timestamp || !message.data) {
    return false;
  }

  // Security-ready: Future signature validation
  // if (message.signature && !verifyMessageSignature(message)) {
  //   return false;
  // }

  return true;
}; 
/**
 * Geo-Fence Event Engine
 * 
 * Event-driven geo-fence evaluation system.
 * This module handles location updates and triggers appropriate alerts/incidents.
 * 
 * Flow:
 * LocationUpdate → GeoFenceEvaluator → RuleEngine → AlertService → IncidentService
 */

import geofencesData from '@/data/geofences.json';
import usersData from '@/data/users.json';

// Types
export interface LocationUpdate {
  userId: string;
  timestamp: string;
  coordinates: { lat: number; lng: number };
  accuracy?: number;
  source: 'gps' | 'wifi' | 'cell' | 'manual';
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'safe_zone' | 'monitored_zone' | 'restricted_zone' | 'transport_hub';
  vertices: Array<{ lat: number; lng: number }>;
  center: { lat: number; lng: number };
  enabled: boolean;
  autoNotify: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
}

export interface GeofenceEvent {
  id: string;
  type: 'entry' | 'exit' | 'breach';
  userId: string;
  geofenceId: string;
  timestamp: string;
  coordinates: { lat: number; lng: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoAlertSent: boolean;
}

export interface Alert {
  id: string;
  type: 'geofence_entry' | 'geofence_exit' | 'geofence_breach' | 'manual' | 'ai_rule';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  sourceId: string;
  userId?: string;
  geofenceId?: string;
  timestamp: string;
  acknowledged: boolean;
  slaDeadline?: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  status: 'reported' | 'assigned' | 'responding' | 'resolved';
  geofenceId?: string;
  affectedUser?: string;
  timestamp: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
}

// Event listeners storage
type EventListener<T> = (event: T) => void;
const eventListeners: {
  geofenceEvent: EventListener<GeofenceEvent>[];
  alert: EventListener<Alert>[];
  incident: EventListener<Incident>[];
} = {
  geofenceEvent: [],
  alert: [],
  incident: [],
};

// User location history for entry/exit detection
const userLocationHistory: Map<string, string[]> = new Map();

// Helper: Check if point is inside polygon (ray casting algorithm)
function isPointInPolygon(
  point: { lat: number; lng: number },
  vertices: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  const n = vertices.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].lat, yi = vertices[i].lng;
    const xj = vertices[j].lat, yj = vertices[j].lng;
    
    if (((yi > point.lng) !== (yj > point.lng)) &&
        (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Helper: Get severity based on zone type
function getSeverityForZone(zoneType: string, eventType: 'entry' | 'exit'): 'low' | 'medium' | 'high' | 'critical' {
  if (zoneType === 'restricted_zone') {
    return eventType === 'entry' ? 'critical' : 'high';
  }
  if (zoneType === 'monitored_zone') {
    return 'medium';
  }
  return 'low';
}

// Helper: Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 9)}`;
}

// Helper: Calculate SLA deadline based on priority
function calculateSlaDeadline(priority: 'low' | 'medium' | 'high' | 'critical'): string {
  const now = new Date();
  const slaMinutes = {
    critical: 5,
    high: 15,
    medium: 60,
    low: 240,
  };
  now.setMinutes(now.getMinutes() + slaMinutes[priority]);
  return now.toISOString();
}

/**
 * GeoFenceEvaluator
 * Evaluates location updates against all active geofences
 */
export function evaluateLocation(update: LocationUpdate): GeofenceEvent[] {
  const events: GeofenceEvent[] = [];
  const geofences = geofencesData as GeofenceZone[];
  
  // Get user's previous geofence locations
  const previousZones = userLocationHistory.get(update.userId) || [];
  const currentZones: string[] = [];
  
  for (const fence of geofences) {
    if (!fence.enabled) continue;
    
    const isInside = isPointInPolygon(update.coordinates, fence.vertices);
    const wasInside = previousZones.includes(fence.id);
    
    if (isInside) {
      currentZones.push(fence.id);
    }
    
    // Entry detection
    if (isInside && !wasInside) {
      const severity = getSeverityForZone(fence.type, 'entry');
      const eventType = fence.type === 'restricted_zone' ? 'breach' : 'entry';
      
      events.push({
        id: generateId('gfe'),
        type: eventType,
        userId: update.userId,
        geofenceId: fence.id,
        timestamp: update.timestamp,
        coordinates: update.coordinates,
        severity,
        autoAlertSent: fence.autoNotify && fence.notifyOnEntry,
      });
    }
    
    // Exit detection
    if (!isInside && wasInside) {
      const severity = getSeverityForZone(fence.type, 'exit');
      
      events.push({
        id: generateId('gfe'),
        type: 'exit',
        userId: update.userId,
        geofenceId: fence.id,
        timestamp: update.timestamp,
        coordinates: update.coordinates,
        severity,
        autoAlertSent: fence.autoNotify && fence.notifyOnExit,
      });
    }
  }
  
  // Update user location history
  userLocationHistory.set(update.userId, currentZones);
  
  return events;
}

/**
 * RuleEngine
 * Applies business rules to geofence events
 */
export function applyRules(event: GeofenceEvent): { createAlert: boolean; createIncident: boolean } {
  // Always create alerts for breach events
  if (event.type === 'breach') {
    return { createAlert: true, createIncident: true };
  }
  
  // Create alerts for high severity events
  if (event.severity === 'high' || event.severity === 'critical') {
    return { createAlert: true, createIncident: true };
  }
  
  // Create alerts only for medium severity
  if (event.severity === 'medium') {
    return { createAlert: true, createIncident: false };
  }
  
  // Low severity - only create alert if auto-alert is enabled
  return { createAlert: event.autoAlertSent, createIncident: false };
}

/**
 * AlertService
 * Creates and manages alerts
 */
export function createAlert(event: GeofenceEvent): Alert {
  const geofences = geofencesData as GeofenceZone[];
  const fence = geofences.find(g => g.id === event.geofenceId);
  const users = usersData as Array<{ id: string; name: string }>;
  const user = users.find(u => u.id === event.userId);
  
  const alertTypeMap = {
    entry: 'geofence_entry' as const,
    exit: 'geofence_exit' as const,
    breach: 'geofence_breach' as const,
  };
  
  const alert: Alert = {
    id: generateId('alt'),
    type: alertTypeMap[event.type],
    priority: event.severity,
    title: `Geofence ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}: ${fence?.name || 'Unknown Zone'}`,
    message: `Tourist ${user?.name || event.userId} ${event.type === 'entry' ? 'entered' : event.type === 'exit' ? 'exited' : 'breached'} ${fence?.name || 'unknown zone'}`,
    source: 'geofence_engine',
    sourceId: event.geofenceId,
    userId: event.userId,
    geofenceId: event.geofenceId,
    timestamp: event.timestamp,
    acknowledged: false,
    slaDeadline: calculateSlaDeadline(event.severity),
  };
  
  // Notify listeners
  eventListeners.alert.forEach(listener => listener(alert));
  
  return alert;
}

/**
 * IncidentService
 * Creates incidents from critical geofence events
 */
export function createIncident(event: GeofenceEvent): Incident {
  const geofences = geofencesData as GeofenceZone[];
  const fence = geofences.find(g => g.id === event.geofenceId);
  
  const incident: Incident = {
    id: generateId('inc'),
    title: `Geofence ${event.type === 'breach' ? 'Breach' : 'Alert'} - ${fence?.name || 'Unknown Zone'}`,
    severity: event.severity === 'critical' ? 'high' : event.severity === 'high' ? 'high' : 'medium',
    status: 'reported',
    geofenceId: event.geofenceId,
    affectedUser: event.userId,
    timestamp: event.timestamp,
    location: {
      name: fence?.name || 'Unknown Location',
      lat: event.coordinates.lat,
      lng: event.coordinates.lng,
    },
  };
  
  // Notify listeners
  eventListeners.incident.forEach(listener => listener(incident));
  
  return incident;
}

/**
 * Main event processing pipeline
 */
export function processLocationUpdate(update: LocationUpdate): {
  events: GeofenceEvent[];
  alerts: Alert[];
  incidents: Incident[];
} {
  const events = evaluateLocation(update);
  const alerts: Alert[] = [];
  const incidents: Incident[] = [];
  
  for (const event of events) {
    // Notify geofence event listeners
    eventListeners.geofenceEvent.forEach(listener => listener(event));
    
    // Apply business rules
    const rules = applyRules(event);
    
    if (rules.createAlert) {
      alerts.push(createAlert(event));
    }
    
    if (rules.createIncident) {
      incidents.push(createIncident(event));
    }
  }
  
  return { events, alerts, incidents };
}

/**
 * Event subscription system
 */
export function onGeofenceEvent(listener: EventListener<GeofenceEvent>): () => void {
  eventListeners.geofenceEvent.push(listener);
  return () => {
    const index = eventListeners.geofenceEvent.indexOf(listener);
    if (index > -1) eventListeners.geofenceEvent.splice(index, 1);
  };
}

export function onAlert(listener: EventListener<Alert>): () => void {
  eventListeners.alert.push(listener);
  return () => {
    const index = eventListeners.alert.indexOf(listener);
    if (index > -1) eventListeners.alert.splice(index, 1);
  };
}

export function onIncident(listener: EventListener<Incident>): () => void {
  eventListeners.incident.push(listener);
  return () => {
    const index = eventListeners.incident.indexOf(listener);
    if (index > -1) eventListeners.incident.splice(index, 1);
  };
}

/**
 * Simulation helper - triggers a mock location update for testing
 */
export function simulateBreach(userId: string, geofenceId: string): {
  events: GeofenceEvent[];
  alerts: Alert[];
  incidents: Incident[];
} {
  const geofences = geofencesData as GeofenceZone[];
  const fence = geofences.find(g => g.id === geofenceId);
  
  if (!fence) {
    console.error(`Geofence ${geofenceId} not found`);
    return { events: [], alerts: [], incidents: [] };
  }
  
  // Simulate entry into the zone
  const update: LocationUpdate = {
    userId,
    timestamp: new Date().toISOString(),
    coordinates: fence.center,
    accuracy: 10,
    source: 'gps',
  };
  
  return processLocationUpdate(update);
}

/**
 * Get current zone status for a user
 */
export function getUserCurrentZones(userId: string): string[] {
  return userLocationHistory.get(userId) || [];
}

/**
 * Clear user location history (for testing/reset)
 */
export function clearUserHistory(userId?: string): void {
  if (userId) {
    userLocationHistory.delete(userId);
  } else {
    userLocationHistory.clear();
  }
}

// Map data types for the real-world Mapbox map

export interface MapTourist {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "verified" | "pending" | "alert" | "inactive";
  riskScore: number;
  lastUpdated: string;
  photo?: string;
  country?: string;
}

export interface MapGeofence {
  id: string;
  name: string;
  description?: string;
  type: "circle" | "polygon" | "rectangle";
  severity: "low" | "medium" | "high";
  status: "active" | "inactive" | "breached" | "scheduled";
  // For circles
  center?: [number, number]; // [lng, lat]
  radius?: number; // in meters
  // For polygons/rectangles
  coordinates?: [number, number][]; // Array of [lng, lat]
  color?: string;
  enabled?: boolean;
  fenceType?: string;
}

export interface MapRegion {
  id: string;
  name: string;
  polygon: [number, number][];
  severity: "low" | "medium" | "high";
  visible?: boolean;
}

export interface DrawingState {
  isDrawing: boolean;
  drawType: "circle" | "polygon" | "rectangle" | null;
  tempCoordinates: [number, number][];
  tempCenter?: [number, number];
  tempRadius?: number;
}

// Status color configurations
export const STATUS_COLORS = {
  verified: "#0B6E4F",
  pending: "#F4A261",
  alert: "#E25B4A",
  inactive: "#9CA3AF",
} as const;

export const SEVERITY_COLORS = {
  low: { border: "#0B6E4F", fill: "rgba(11, 110, 79, 0.1)" },
  medium: { border: "#F4A261", fill: "rgba(244, 162, 97, 0.1)" },
  high: { border: "#E25B4A", fill: "rgba(226, 91, 74, 0.1)" },
  breached: { border: "#E25B4A", fill: "rgba(226, 91, 74, 0.2)" },
  disabled: { border: "#9CA3AF", fill: "transparent" },
} as const;

export const FENCE_TYPE_COLORS: Record<string, { border: string; fill: string }> = {
  safe_zone: { border: "#0B6E4F", fill: "rgba(11, 110, 79, 0.08)" },
  monitored_zone: { border: "#00A3B4", fill: "rgba(0, 163, 180, 0.08)" },
  restricted_zone: { border: "#E25B4A", fill: "rgba(226, 91, 74, 0.08)" },
  transport_hub: { border: "#0B6E4F", fill: "rgba(11, 110, 79, 0.08)" },
};

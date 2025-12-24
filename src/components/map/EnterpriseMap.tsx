import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  Clock,
  MapPin,
  AlertCircle,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Professional status colors matching enterprise design
const statusConfig = {
  verified: { color: "hsl(156, 82%, 24%)", label: "Verified", risk: "low" },
  pending: { color: "hsl(38, 92%, 50%)", label: "Pending", risk: "medium" },
  alert: { color: "hsl(8, 72%, 59%)", label: "At Risk", risk: "high" },
  inactive: { color: "hsl(220, 9%, 46%)", label: "Inactive", risk: "none" },
} as const;

const severityConfig = {
  low: { border: "hsl(156, 82%, 24%)", fill: "hsla(156, 82%, 24%, 0.08)" },
  medium: { border: "hsl(38, 92%, 50%)", fill: "hsla(38, 92%, 50%, 0.08)" },
  high: { border: "hsl(8, 72%, 59%)", fill: "hsla(8, 72%, 59%, 0.08)" },
  active: { border: "hsl(156, 82%, 24%)", fill: "hsla(156, 82%, 24%, 0.06)" },
  disabled: { border: "hsl(220, 9%, 70%)", fill: "transparent" },
} as const;

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: keyof typeof statusConfig;
  riskScore?: number;
  lastCheckIn?: string;
  photo?: string;
}

export interface MapGeofence {
  id: string;
  name: string;
  type: string;
  severity: "low" | "medium" | "high";
  status: "active" | "breached" | "disabled";
  coordinates?: { lat: number; lng: number }[];
  center?: { lat: number; lng: number };
}

interface EnterpriseMapProps {
  markers?: MapMarker[];
  geofences?: MapGeofence[];
  onMarkerSelect?: (marker: MapMarker) => void;
  onGeofenceSelect?: (geofence: MapGeofence) => void;
  selectedMarkerId?: string | null;
  selectedGeofenceId?: string | null;
  showMarkers?: boolean;
  showGeofences?: boolean;
  className?: string;
}

// Memoized marker component for performance
const MarkerDot = memo(function MarkerDot({
  marker,
  position,
  isSelected,
  isFocused,
  onClick,
  onKeyDown,
  tabIndex,
}: {
  marker: MapMarker;
  position: { top: string; left: string };
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
}) {
  const statusColor = statusConfig[marker.status].color;
  const statusLabel = statusConfig[marker.status].label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          role="button"
          tabIndex={tabIndex}
          className={cn(
            "absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full",
            "border-2 border-card transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
            "hover:scale-125 hover:shadow-md",
            isSelected && "ring-2 ring-primary ring-offset-1 scale-125",
            isFocused && "ring-2 ring-ring ring-offset-1"
          )}
          style={{
            top: position.top,
            left: position.left,
            backgroundColor: statusColor,
            boxShadow: isSelected
              ? `0 0 0 4px ${statusColor}20`
              : "0 1px 3px rgba(0,0,0,0.12)",
          }}
          onClick={onClick}
          onKeyDown={onKeyDown}
          aria-label={`Tourist: ${marker.name}, Status: ${statusLabel}`}
        />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-card border border-border shadow-lg"
      >
        <div className="text-xs">
          <p className="font-medium text-foreground">{marker.name}</p>
          <p className="text-muted-foreground">Status: {statusLabel}</p>
          {marker.riskScore !== undefined && (
            <p className="text-muted-foreground">Risk Score: {marker.riskScore}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

// Memoized cluster component
const MarkerCluster = memo(function MarkerCluster({
  count,
  position,
  onClick,
}: {
  count: number;
  position: { top: string; left: string };
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "absolute w-8 h-8 -ml-4 -mt-4 rounded-full",
            "bg-muted border border-border",
            "flex items-center justify-center",
            "text-xs font-medium text-foreground",
            "transition-all duration-200",
            "hover:scale-110 hover:bg-muted/80",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          style={{ top: position.top, left: position.left }}
          onClick={onClick}
          aria-label={`${count} Active Tourists. Click to zoom in.`}
        >
          {count}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border border-border">
        <p className="text-xs text-foreground">{count} Active Tourists</p>
      </TooltipContent>
    </Tooltip>
  );
});

// Memoized geofence component
const GeofenceZone = memo(function GeofenceZone({
  geofence,
  position,
  isSelected,
  onClick,
}: {
  geofence: MapGeofence;
  position: { top: string; left: string; width: string; height: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const config =
    geofence.status === "breached"
      ? severityConfig.high
      : geofence.status === "disabled"
      ? severityConfig.disabled
      : severityConfig[geofence.severity];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "absolute rounded-lg transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            geofence.status === "disabled" && "border-dashed opacity-60",
            geofence.status === "breached" && "animate-pulse",
            isSelected && "ring-2 ring-primary ring-offset-2"
          )}
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            height: position.height,
            border: `2px solid ${config.border}`,
            backgroundColor: config.fill,
          }}
          onClick={onClick}
          aria-label={`Geofence: ${geofence.name}, Status: ${geofence.status}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border border-border">
        <p className="text-xs font-medium text-foreground">{geofence.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{geofence.status}</p>
      </TooltipContent>
    </Tooltip>
  );
});

export function EnterpriseMap({
  markers = [],
  geofences = [],
  onMarkerSelect,
  onGeofenceSelect,
  selectedMarkerId,
  selectedGeofenceId,
  showMarkers = true,
  showGeofences = true,
  className,
}: EnterpriseMapProps) {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [markersVisible, setMarkersVisible] = useState(true);
  const [geofencesVisible, setGeofencesVisible] = useState(true);
  const [focusedMarkerIndex, setFocusedMarkerIndex] = useState(-1);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Calculate marker positions based on coordinates
  const markerPositions = useMemo(() => {
    if (!markers.length) return [];
    
    const minLat = Math.min(...markers.map((m) => m.lat));
    const maxLat = Math.max(...markers.map((m) => m.lat));
    const minLng = Math.min(...markers.map((m) => m.lng));
    const maxLng = Math.max(...markers.map((m) => m.lng));
    
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;

    return markers.map((marker) => ({
      marker,
      position: {
        top: `${15 + ((maxLat - marker.lat) / latRange) * 70}%`,
        left: `${15 + ((marker.lng - minLng) / lngRange) * 70}%`,
      },
    }));
  }, [markers]);

  // Geofence positions (fixed layout for mock)
  const geofencePositions = useMemo(() => {
    const positions = [
      { top: "10%", left: "10%", width: "25%", height: "30%" },
      { top: "45%", left: "55%", width: "30%", height: "25%" },
      { top: "35%", left: "5%", width: "20%", height: "22%" },
      { top: "8%", left: "60%", width: "28%", height: "28%" },
      { top: "55%", left: "25%", width: "22%", height: "28%" },
    ];
    return geofences.map((gf, i) => ({
      geofence: gf,
      position: positions[i % positions.length],
    }));
  }, [geofences]);

  // Handle zoom
  const handleZoom = useCallback((direction: "in" | "out") => {
    setZoom((prev) => {
      if (direction === "in") return Math.min(prev + 0.25, 2);
      return Math.max(prev - 0.25, 0.5);
    });
  }, []);

  // Handle center
  const handleCenter = useCallback(() => {
    setZoom(1);
    setAnnouncement("Map centered");
  }, []);

  // Handle marker selection
  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      setSelectedMarker(marker);
      onMarkerSelect?.(marker);
      setAnnouncement(`Selected tourist ${marker.name}, ${statusConfig[marker.status].label}`);
    },
    [onMarkerSelect]
  );

  // Handle keyboard navigation
  const handleMarkerKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (index + 1) % markers.length;
        setFocusedMarkerIndex(nextIndex);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = (index - 1 + markers.length) % markers.length;
        setFocusedMarkerIndex(prevIndex);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleMarkerClick(markers[index]);
      } else if (e.key === "Escape") {
        setSelectedMarker(null);
        setFocusedMarkerIndex(-1);
      }
    },
    [markers, handleMarkerClick]
  );

  // Close drawer
  const handleCloseDrawer = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Announce on load
  useEffect(() => {
    const activeCount = markers.filter((m) => m.status !== "inactive").length;
    setAnnouncement(`Map loaded with ${activeCount} active tourists`);
  }, [markers]);

  return (
    <div className={cn("relative h-full", className)}>
      <Card className="relative h-full overflow-hidden bg-muted/30 border border-border">
        {/* Neutral Grayscale Map Background */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {/* Base map layer - neutral grayscale */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,0%,97%)] via-[hsl(0,0%,95%)] to-[hsl(200,10%,93%)]" />
          
          {/* Road grid pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-30"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="roadGrid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="hsl(0, 0%, 80%)"
                  strokeWidth="1"
                />
              </pattern>
              <pattern
                id="minorGrid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="hsl(0, 0%, 88%)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#minorGrid)" />
            <rect width="100%" height="100%" fill="url(#roadGrid)" />
          </svg>

          {/* Water feature - desaturated */}
          <div className="absolute top-[60%] right-[5%] w-[20%] h-[30%] rounded-lg bg-[hsl(200,15%,85%)] opacity-50" />
          
          {/* Block features - very subtle */}
          <div className="absolute top-[20%] left-[30%] w-[15%] h-[12%] rounded bg-[hsl(0,0%,92%)]" />
          <div className="absolute top-[65%] left-[15%] w-[12%] h-[10%] rounded bg-[hsl(0,0%,91%)]" />

          {/* Geofences */}
          {showGeofences && geofencesVisible && geofencePositions.map(({ geofence, position }) => (
            <GeofenceZone
              key={geofence.id}
              geofence={geofence}
              position={position}
              isSelected={selectedGeofenceId === geofence.id}
              onClick={() => onGeofenceSelect?.(geofence)}
            />
          ))}

          {/* Markers */}
          {showMarkers && markersVisible && zoom >= 0.75 && markerPositions.map(({ marker, position }, index) => (
            <MarkerDot
              key={marker.id}
              marker={marker}
              position={position}
              isSelected={selectedMarkerId === marker.id || selectedMarker?.id === marker.id}
              isFocused={focusedMarkerIndex === index}
              onClick={() => handleMarkerClick(marker)}
              onKeyDown={(e) => handleMarkerKeyDown(e, index)}
              tabIndex={focusedMarkerIndex === index ? 0 : -1}
            />
          ))}

          {/* Clustered view when zoomed out */}
          {showMarkers && markersVisible && zoom < 0.75 && markers.length > 0 && (
            <MarkerCluster
              count={markers.length}
              position={{ top: "50%", left: "50%" }}
              onClick={() => setZoom(1)}
            />
          )}
        </div>

        {/* Map Controls - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border hover:bg-muted shadow-sm"
                onClick={() => handleZoom("in")}
                aria-label="Zoom in"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border hover:bg-muted shadow-sm"
                onClick={() => handleZoom("out")}
                aria-label="Zoom out"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border hover:bg-muted shadow-sm"
                onClick={handleCenter}
                aria-label="Center view"
              >
                <Crosshair className="w-4 h-4 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Center View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "w-9 h-9 bg-card border-border hover:bg-muted shadow-sm",
                  showLayersPanel && "bg-muted"
                )}
                onClick={() => setShowLayersPanel(!showLayersPanel)}
                aria-label="Toggle layers"
                aria-expanded={showLayersPanel}
              >
                <Layers className="w-4 h-4 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Toggle Layers</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border hover:bg-muted shadow-sm"
                onClick={() => setMarkersVisible(!markersVisible)}
                aria-label={markersVisible ? "Hide markers" : "Show markers"}
                aria-pressed={markersVisible}
              >
                {markersVisible ? (
                  <Eye className="w-4 h-4 text-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Toggle Markers</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border hover:bg-muted shadow-sm"
                onClick={() => setGeofencesVisible(!geofencesVisible)}
                aria-label={geofencesVisible ? "Hide geofences" : "Show geofences"}
                aria-pressed={geofencesVisible}
              >
                <Shield className={cn("w-4 h-4", geofencesVisible ? "text-foreground" : "text-muted-foreground")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Toggle Geofences</TooltipContent>
          </Tooltip>
        </div>

        {/* Layers Panel */}
        {showLayersPanel && (
          <div className="absolute top-4 right-16 bg-card border border-border rounded-lg shadow-lg p-4 z-30 min-w-[160px]">
            <p className="text-xs font-medium text-foreground mb-3">Map Layers</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={markersVisible}
                  onChange={(e) => setMarkersVisible(e.target.checked)}
                  className="rounded border-border"
                />
                Tourists
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={geofencesVisible}
                  onChange={(e) => setGeofencesVisible(e.target.checked)}
                  className="rounded border-border"
                />
                Geofences
              </label>
            </div>
          </div>
        )}

        {/* Status Legend - Bottom Left */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 z-20">
          <p className="text-xs font-medium text-foreground mb-2">Status</p>
          <div className="space-y-1.5">
            {Object.entries(statusConfig).map(([key, { color, label }]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full border-2 border-card"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom Indicator - Bottom Right */}
        <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded px-2 py-1 z-20">
          <p className="text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </p>
        </div>

        {/* Screen Reader Announcements */}
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </Card>

      {/* Selected Marker Drawer */}
      {selectedMarker && (
        <div
          className="absolute top-0 right-0 w-[420px] h-full bg-card border-l border-border shadow-xl z-40 animate-slide-in"
          role="dialog"
          aria-label={`Details for ${selectedMarker.name}`}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: statusConfig[selectedMarker.status].color + "20" }}
                >
                  <Users className="w-5 h-5" style={{ color: statusConfig[selectedMarker.status].color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedMarker.name}</h3>
                  <Badge
                    variant="outline"
                    className="text-xs mt-0.5"
                    style={{
                      borderColor: statusConfig[selectedMarker.status].color,
                      color: statusConfig[selectedMarker.status].color,
                    }}
                  >
                    {statusConfig[selectedMarker.status].label}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCloseDrawer}
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Location */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Last Known Location
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Last Check-in */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Last Check-in
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatTime(selectedMarker.lastCheckIn)}</span>
                  </div>
                </div>

                <Separator />

                {/* Risk Score */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Risk Assessment
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-2xl font-semibold text-foreground">
                        {selectedMarker.riskScore ?? "N/A"}
                      </span>
                    </div>
                    {selectedMarker.riskScore !== undefined && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          selectedMarker.riskScore < 30 && "border-primary text-primary",
                          selectedMarker.riskScore >= 30 && selectedMarker.riskScore < 60 && "border-warning text-warning",
                          selectedMarker.riskScore >= 60 && "border-destructive text-destructive"
                        )}
                      >
                        {selectedMarker.riskScore < 30 ? "Low Risk" : selectedMarker.riskScore < 60 ? "Medium Risk" : "High Risk"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t border-border space-y-2">
              <Button
                className="w-full justify-between"
                variant="default"
                onClick={() => navigate(`/my-id?user=${selectedMarker.id}`)}
              >
                View Digital ID
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                className="w-full justify-between"
                variant="outline"
                onClick={() => navigate(`/audit-log?user=${selectedMarker.id}`)}
              >
                View History
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                className="w-full justify-between"
                variant="outline"
                onClick={() => navigate("/alerts/create")}
              >
                Dispatch Help
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnterpriseMap;

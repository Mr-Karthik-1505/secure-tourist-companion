import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  Pencil,
  MapPin,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface Vertex {
  lat: number;
  lng: number;
}

interface Geofence {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  color: string;
  vertices: Vertex[];
  center: { lat: number; lng: number };
  status?: "active" | "inactive" | "breached" | "scheduled";
  fenceType?: "circle" | "polygon";
  radius?: number;
}

interface GeofenceMapProps {
  geofences: Geofence[];
  selectedFenceId: string | null;
  onSelectFence: (fence: Geofence) => void;
  onStartDraw?: (type: "circle" | "polygon") => void;
  isDrawMode?: boolean;
  breachedFenceId?: string | null;
  className?: string;
}

const mapControlButtons = [
  { icon: Plus, label: "Zoom In", action: "zoomIn" },
  { icon: Minus, label: "Zoom Out", action: "zoomOut" },
  { icon: Crosshair, label: "Center Map", action: "center" },
  { icon: Layers, label: "Toggle Layers", action: "layers" },
  { icon: Pencil, label: "Draw Fence", action: "draw" },
] as const;

export function GeofenceMap({
  geofences,
  selectedFenceId,
  onSelectFence,
  onStartDraw,
  isDrawMode = false,
  breachedFenceId,
  className,
}: GeofenceMapProps) {
  const [zoom, setZoom] = useState(1);
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");
  const [showLayers, setShowLayers] = useState(false);
  const [focusedFenceIndex, setFocusedFenceIndex] = useState(-1);
  const mapRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Tab" && !e.shiftKey && mapRef.current?.contains(document.activeElement)) {
        // Allow default tab behavior
      } else if (e.key === "Enter" && focusedFenceIndex >= 0) {
        const fence = geofences[focusedFenceIndex];
        if (fence) onSelectFence(fence);
      } else if (e.key === "Escape") {
        setFocusedFenceIndex(-1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedFenceIndex((prev) => Math.min(prev + 1, geofences.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedFenceIndex((prev) => Math.max(prev - 1, 0));
      }
    },
    [focusedFenceIndex, geofences, onSelectFence]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleControlAction = (action: string) => {
    switch (action) {
      case "zoomIn":
        setZoom((prev) => Math.min(prev + 0.2, 2));
        break;
      case "zoomOut":
        setZoom((prev) => Math.max(prev - 0.2, 0.5));
        break;
      case "center":
        setZoom(1);
        break;
      case "layers":
        setShowLayers(!showLayers);
        setMapStyle((prev) => (prev === "street" ? "satellite" : "street"));
        break;
      case "draw":
        onStartDraw?.("polygon");
        break;
    }
  };

  // Calculate position for fence polygon on the map visualization
  const getFencePosition = (fence: Geofence, index: number) => {
    const positions = [
      { top: "12%", left: "15%", width: "28%", height: "32%" },
      { top: "55%", left: "50%", width: "32%", height: "28%" },
      { top: "42%", left: "8%", width: "22%", height: "24%" },
      { top: "15%", left: "55%", width: "28%", height: "28%" },
      { top: "50%", left: "28%", width: "24%", height: "30%" },
    ];
    return positions[index % positions.length];
  };

  const getFenceStatus = (fence: Geofence) => {
    if (breachedFenceId === fence.id) return "breached";
    if (!fence.enabled) return "inactive";
    return fence.status || "active";
  };

  const getStatusStyles = (status: string, type: string) => {
    if (status === "breached") {
      return "border-destructive bg-destructive/20 animate-pulse";
    }
    if (status === "inactive") {
      return "border-muted-foreground/30 bg-muted/20 opacity-50";
    }
    if (status === "scheduled") {
      return "border-warning bg-warning/10";
    }
    // Active states by zone type
    if (type === "restricted_zone") {
      return "border-destructive bg-destructive/10 hover:bg-destructive/20";
    }
    if (type === "safe_zone") {
      return "border-primary bg-primary/10 hover:bg-primary/20";
    }
    return "border-accent bg-accent/10 hover:bg-accent/20";
  };

  return (
    <div
      ref={mapRef}
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-br transition-all duration-500",
        mapStyle === "street"
          ? "from-accent/5 via-background to-primary/5"
          : "from-muted via-muted/80 to-muted",
        className
      )}
      tabIndex={0}
      role="application"
      aria-label="Geo-fencing map area. Use arrow keys to navigate fences, Enter to select."
    >
      {/* Map Grid Pattern */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: mapStyle === "street" ? 0.25 : 0.1, transform: `scale(${zoom})` }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-primary/50"
              />
            </pattern>
            <pattern id="mapGridSmall" width="15" height="15" patternUnits="userSpaceOnUse">
              <path
                d="M 15 0 L 0 0 0 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.25"
                className="text-muted-foreground/30"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGridSmall)" />
          <rect width="100%" height="100%" fill="url(#mapGrid)" />
        </svg>
      </div>

      {/* Draw Mode Overlay */}
      {isDrawMode && (
        <div className="absolute inset-0 bg-primary/5 z-10 flex items-center justify-center">
          <div className="bg-card px-6 py-4 rounded-xl shadow-lg border border-primary">
            <p className="text-foreground font-medium">Click points to draw fence polygon</p>
            <p className="text-muted-foreground text-sm">Double-click to finish</p>
          </div>
        </div>
      )}

      {/* Fence Polygons */}
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        {geofences.map((fence, index) => {
          const pos = getFencePosition(fence, index);
          const status = getFenceStatus(fence);
          const isSelected = selectedFenceId === fence.id;
          const isFocused = focusedFenceIndex === index;

          return (
            <button
              key={fence.id}
              className={cn(
                "absolute rounded-xl border-2 transition-all duration-300 cursor-pointer focus-ring",
                getStatusStyles(status, fence.type),
                isSelected && "ring-2 ring-primary ring-offset-2 border-dashed",
                isFocused && "ring-2 ring-ring ring-offset-1"
              )}
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                height: pos.height,
              }}
              onClick={() => onSelectFence(fence)}
              onFocus={() => setFocusedFenceIndex(index)}
              aria-label={`${fence.name}: ${fence.description}. Status: ${status}`}
              aria-selected={isSelected}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-2">
                  {status === "breached" ? (
                    <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-destructive animate-bounce" />
                  ) : status === "scheduled" ? (
                    <Clock className="w-6 h-6 mx-auto mb-1 text-warning" />
                  ) : (
                    <MapPin
                      className={cn(
                        "w-6 h-6 mx-auto mb-1",
                        fence.type === "restricted_zone"
                          ? "text-destructive"
                          : fence.type === "safe_zone"
                          ? "text-primary"
                          : "text-accent"
                      )}
                    />
                  )}
                  <p className="text-xs font-medium text-foreground truncate max-w-[120px]">
                    {fence.name}
                  </p>
                  {status === "breached" && (
                    <span className="text-[10px] text-destructive font-semibold uppercase">
                      BREACH
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        {mapControlButtons.map(({ icon: Icon, label, action }) => (
          <Tooltip key={action}>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card border border-border"
                onClick={() => handleControlAction(action)}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <div className="absolute top-4 right-16 bg-card rounded-lg shadow-lg p-3 z-20 animate-fade-in-up">
          <p className="text-xs font-medium text-foreground mb-2">Map Style</p>
          <div className="space-y-1">
            <button
              className={cn(
                "w-full text-left px-2 py-1 rounded text-sm",
                mapStyle === "street" && "bg-primary/10 text-primary"
              )}
              onClick={() => setMapStyle("street")}
            >
              Street
            </button>
            <button
              className={cn(
                "w-full text-left px-2 py-1 rounded text-sm",
                mapStyle === "satellite" && "bg-primary/10 text-primary"
              )}
              onClick={() => setMapStyle("satellite")}
            >
              Satellite
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-20">
        <p className="text-xs font-semibold text-foreground mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-primary border border-primary" />
            <span className="text-muted-foreground">Safe Zone</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-accent border border-accent" />
            <span className="text-muted-foreground">Monitored</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-destructive border border-destructive" />
            <span className="text-muted-foreground">Restricted</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-dashed border-primary" />
            <span className="text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-destructive/30 border border-destructive animate-pulse" />
            <span className="text-muted-foreground">Breached</span>
          </div>
        </div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1 z-20">
        <p className="text-xs text-muted-foreground">
          Zoom: {Math.round(zoom * 100)}%
        </p>
      </div>

      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {breachedFenceId && `Alert: Fence breach detected`}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  Pencil,
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

// Severity configuration for enterprise look
const severityConfig = {
  safe_zone: { border: "hsl(156, 82%, 24%)", fill: "hsla(156, 82%, 24%, 0.06)" },
  monitored: { border: "hsl(186, 100%, 35%)", fill: "hsla(186, 100%, 35%, 0.06)" },
  restricted_zone: { border: "hsl(8, 72%, 59%)", fill: "hsla(8, 72%, 59%, 0.06)" },
  breached: { border: "hsl(8, 72%, 59%)", fill: "hsla(8, 72%, 59%, 0.12)" },
  disabled: { border: "hsl(220, 9%, 70%)", fill: "transparent" },
} as const;

const mapControlButtons = [
  { icon: Plus, label: "Zoom In", action: "zoomIn" },
  { icon: Minus, label: "Zoom Out", action: "zoomOut" },
  { icon: Crosshair, label: "Center Map", action: "center" },
  { icon: Layers, label: "Toggle Layers", action: "layers" },
  { icon: Pencil, label: "Draw Fence", action: "draw" },
] as const;

// Memoized fence zone component
const FenceZone = memo(function FenceZone({
  fence,
  position,
  isSelected,
  isFocused,
  isBreached,
  onClick,
  onFocus,
}: {
  fence: Geofence;
  position: { top: string; left: string; width: string; height: string };
  isSelected: boolean;
  isFocused: boolean;
  isBreached: boolean;
  onClick: () => void;
  onFocus: () => void;
}) {
  const getConfig = () => {
    if (isBreached) return severityConfig.breached;
    if (!fence.enabled) return severityConfig.disabled;
    if (fence.type === "restricted_zone") return severityConfig.restricted_zone;
    if (fence.type === "safe_zone") return severityConfig.safe_zone;
    return severityConfig.monitored;
  };

  const config = getConfig();
  const status = isBreached ? "breached" : !fence.enabled ? "disabled" : "active";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "absolute rounded-lg transition-all duration-300",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            !fence.enabled && "border-dashed opacity-60",
            isBreached && "animate-pulse",
            isSelected && "ring-2 ring-primary ring-offset-2",
            isFocused && "ring-2 ring-ring ring-offset-1"
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
          onFocus={onFocus}
          aria-label={`${fence.name}: ${fence.description}. Status: ${status}`}
          aria-selected={isSelected}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-2">
              <p className="text-xs font-medium text-foreground truncate max-w-[100px]">
                {fence.name}
              </p>
              {isBreached && (
                <span className="text-[10px] text-destructive font-semibold uppercase">
                  BREACH
                </span>
              )}
            </div>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border border-border shadow-lg">
        <div className="text-xs">
          <p className="font-medium text-foreground">{fence.name}</p>
          <p className="text-muted-foreground capitalize">{status}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

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

  // Fence positions
  const fencePositions = useMemo(() => {
    const positions = [
      { top: "10%", left: "10%", width: "25%", height: "28%" },
      { top: "48%", left: "55%", width: "30%", height: "26%" },
      { top: "38%", left: "5%", width: "22%", height: "24%" },
      { top: "8%", left: "58%", width: "28%", height: "26%" },
      { top: "55%", left: "25%", width: "24%", height: "28%" },
    ];
    return positions;
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!mapRef.current?.contains(document.activeElement)) return;
      
      if (e.key === "Enter" && focusedFenceIndex >= 0) {
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

  const handleControlAction = useCallback((action: string) => {
    switch (action) {
      case "zoomIn":
        setZoom((prev) => Math.min(prev + 0.25, 2));
        break;
      case "zoomOut":
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
        break;
      case "center":
        setZoom(1);
        break;
      case "layers":
        setShowLayers((prev) => !prev);
        break;
      case "draw":
        onStartDraw?.("polygon");
        break;
    }
  }, [onStartDraw]);

  return (
    <div
      ref={mapRef}
      className={cn(
        "relative rounded-xl overflow-hidden border border-border",
        className
      )}
      tabIndex={0}
      role="application"
      aria-label="Geo-fencing map area. Use arrow keys to navigate fences, Enter to select."
    >
      {/* Neutral Grayscale Map Background */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
      >
        {/* Base layer */}
        <div className={cn(
          "absolute inset-0",
          mapStyle === "street" 
            ? "bg-gradient-to-br from-[hsl(0,0%,97%)] via-[hsl(0,0%,95%)] to-[hsl(200,10%,93%)]"
            : "bg-gradient-to-br from-[hsl(0,0%,30%)] via-[hsl(0,0%,25%)] to-[hsl(200,10%,20%)]"
        )} />

        {/* Road grid */}
        <svg
          className={cn(
            "absolute inset-0 w-full h-full",
            mapStyle === "street" ? "opacity-30" : "opacity-15"
          )}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="geoRoadGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke={mapStyle === "street" ? "hsl(0, 0%, 80%)" : "hsl(0, 0%, 50%)"}
                strokeWidth="1"
              />
            </pattern>
            <pattern id="geoMinorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke={mapStyle === "street" ? "hsl(0, 0%, 88%)" : "hsl(0, 0%, 40%)"}
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geoMinorGrid)" />
          <rect width="100%" height="100%" fill="url(#geoRoadGrid)" />
        </svg>

        {/* Water feature */}
        <div className={cn(
          "absolute top-[60%] right-[3%] w-[18%] h-[28%] rounded-lg opacity-40",
          mapStyle === "street" ? "bg-[hsl(200,15%,85%)]" : "bg-[hsl(200,20%,40%)]"
        )} />

        {/* Draw Mode Overlay */}
        {isDrawMode && (
          <div className="absolute inset-0 bg-primary/5 z-10 flex items-center justify-center">
            <div className="bg-card px-6 py-4 rounded-xl shadow-lg border border-primary">
              <p className="text-foreground font-medium">Click points to draw fence polygon</p>
              <p className="text-muted-foreground text-sm">Double-click to finish</p>
            </div>
          </div>
        )}

        {/* Fence Zones */}
        {geofences.map((fence, index) => (
          <FenceZone
            key={fence.id}
            fence={fence}
            position={fencePositions[index % fencePositions.length]}
            isSelected={selectedFenceId === fence.id}
            isFocused={focusedFenceIndex === index}
            isBreached={breachedFenceId === fence.id}
            onClick={() => onSelectFence(fence)}
            onFocus={() => setFocusedFenceIndex(index)}
          />
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        {mapControlButtons.map(({ icon: Icon, label, action }) => (
          <Tooltip key={action}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border hover:bg-muted shadow-sm"
                onClick={() => handleControlAction(action)}
                aria-label={label}
              >
                <Icon className="w-4 h-4 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <div className="absolute top-4 right-16 bg-card border border-border rounded-lg shadow-lg p-4 z-30 min-w-[140px]">
          <p className="text-xs font-medium text-foreground mb-3">Map Style</p>
          <div className="space-y-2">
            <button
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
                mapStyle === "street" ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              )}
              onClick={() => setMapStyle("street")}
            >
              Street
            </button>
            <button
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
                mapStyle === "satellite" ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              )}
              onClick={() => setMapStyle("satellite")}
            >
              Satellite
            </button>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 z-20">
        <p className="text-xs font-medium text-foreground mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ border: `2px solid ${severityConfig.safe_zone.border}`, backgroundColor: severityConfig.safe_zone.fill }}
            />
            <span className="text-muted-foreground">Safe Zone</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ border: `2px solid ${severityConfig.monitored.border}`, backgroundColor: severityConfig.monitored.fill }}
            />
            <span className="text-muted-foreground">Monitored</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ border: `2px solid ${severityConfig.restricted_zone.border}`, backgroundColor: severityConfig.restricted_zone.fill }}
            />
            <span className="text-muted-foreground">Restricted</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded border-dashed"
              style={{ border: `2px dashed ${severityConfig.disabled.border}` }}
            />
            <span className="text-muted-foreground">Disabled</span>
          </div>
        </div>
      </div>

      {/* Zoom Indicator */}
      <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded px-2 py-1 z-20">
        <p className="text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </p>
      </div>

      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {breachedFenceId && `Alert: Fence breach detected`}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  Circle,
  Pentagon,
  Square,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Users,
  MapPin,
} from "lucide-react";
import { MapTourist, MapGeofence, STATUS_COLORS, FENCE_TYPE_COLORS } from "./types";
import { MapInfoDrawer } from "./MapInfoDrawer";

// Default to demo token - user should provide their own
const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsdzV4MzBweTBhYnQycXF4NzBzNmRyMzgifQ.demo";

interface MapboxMapProps {
  tourists?: MapTourist[];
  geofences?: MapGeofence[];
  selectedFenceId?: string | null;
  breachedFenceId?: string | null;
  onSelectFence?: (fence: MapGeofence) => void;
  onSelectTourist?: (tourist: MapTourist) => void;
  onCreateFence?: (fence: Partial<MapGeofence>) => void;
  onUpdateFence?: (fence: MapGeofence) => void;
  onDeleteFence?: (id: string) => void;
  className?: string;
  mapboxToken?: string;
}

export function MapboxMap({
  tourists = [],
  geofences = [],
  selectedFenceId,
  breachedFenceId,
  onSelectFence,
  onSelectTourist,
  onCreateFence,
  onUpdateFence,
  onDeleteFence,
  className,
  mapboxToken,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets");
  const [showLayers, setShowLayers] = useState(false);
  const [showTourists, setShowTourists] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [drawMode, setDrawMode] = useState<"circle" | "polygon" | "rectangle" | null>(null);
  const [drawCoords, setDrawCoords] = useState<[number, number][]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    type: "tourist" | "geofence";
    data: MapTourist | MapGeofence;
  } | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [activeToken, setActiveToken] = useState(mapboxToken || "");

  const { hasPermission, currentRole } = useRole();
  const canEditGeofences = hasPermission("canManageGeofence");

  // Bangkok center for demo
  const defaultCenter: [number, number] = [100.5018, 13.7563];
  const defaultZoom = 12;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!activeToken) return;

    mapboxgl.accessToken = activeToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle === "streets" 
          ? "mapbox://styles/mapbox/streets-v12"
          : "mapbox://styles/mapbox/satellite-streets-v12",
        center: defaultCenter,
        zoom: defaultZoom,
        pitch: 0,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "top-right"
      );

      map.current.on("load", () => {
        setMapLoaded(true);
      });

      map.current.on("click", handleMapClick);

      return () => {
        map.current?.remove();
        map.current = null;
      };
    } catch (error) {
      console.error("Map initialization error:", error);
    }
  }, [activeToken, mapStyle]);

  // Update map style
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const styleUrl = mapStyle === "streets"
      ? "mapbox://styles/mapbox/streets-v12"
      : "mapbox://styles/mapbox/satellite-streets-v12";
    
    map.current.setStyle(styleUrl);
  }, [mapStyle, mapLoaded]);

  // Render tourist markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!showTourists) return;

    tourists.forEach((tourist) => {
      const el = document.createElement("div");
      el.className = "tourist-marker";
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        background-color: ${STATUS_COLORS[tourist.status]};
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.15s ease;
      `;
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", `Tourist: ${tourist.name}, Status: ${tourist.status}`);

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
        el.style.boxShadow = `0 0 8px ${STATUS_COLORS[tourist.status]}`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedItem({ type: "tourist", data: tourist });
        onSelectTourist?.(tourist);
      });

      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedItem({ type: "tourist", data: tourist });
          onSelectTourist?.(tourist);
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([tourist.lng, tourist.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [tourists, showTourists, mapLoaded, onSelectTourist]);

  // Render geofences
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing geofence layers/sources
    geofences.forEach((fence) => {
      if (map.current?.getLayer(`fence-fill-${fence.id}`)) {
        map.current.removeLayer(`fence-fill-${fence.id}`);
      }
      if (map.current?.getLayer(`fence-line-${fence.id}`)) {
        map.current.removeLayer(`fence-line-${fence.id}`);
      }
      if (map.current?.getSource(`fence-${fence.id}`)) {
        map.current.removeSource(`fence-${fence.id}`);
      }
    });

    if (!showGeofences) return;

    geofences.forEach((fence) => {
      let coordinates: [number, number][] = [];
      
      if (fence.coordinates && fence.coordinates.length > 0) {
        coordinates = fence.coordinates;
      } else if (fence.center && fence.radius) {
        // Generate circle polygon using turf
        const circle = turf.circle(fence.center, fence.radius / 1000, {
          steps: 64,
          units: "kilometers",
        });
        coordinates = circle.geometry.coordinates[0] as [number, number][];
      }

      if (coordinates.length === 0) return;

      const isBreached = breachedFenceId === fence.id;
      const isSelected = selectedFenceId === fence.id;
      const fenceType = fence.fenceType || "monitored_zone";
      const colors = isBreached 
        ? { border: "#E25B4A", fill: "rgba(226, 91, 74, 0.15)" }
        : FENCE_TYPE_COLORS[fenceType] || FENCE_TYPE_COLORS.monitored_zone;

      try {
        map.current?.addSource(`fence-${fence.id}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              id: fence.id,
              name: fence.name,
              status: fence.status,
            },
            geometry: {
              type: "Polygon",
              coordinates: [coordinates],
            },
          },
        });

        map.current?.addLayer({
          id: `fence-fill-${fence.id}`,
          type: "fill",
          source: `fence-${fence.id}`,
          paint: {
            "fill-color": colors.fill,
            "fill-opacity": fence.status === "inactive" ? 0.3 : 0.6,
          },
        });

        map.current?.addLayer({
          id: `fence-line-${fence.id}`,
          type: "line",
          source: `fence-${fence.id}`,
          paint: {
            "line-color": colors.border,
            "line-width": isSelected ? 3 : 2,
            "line-dasharray": fence.status === "inactive" ? [2, 2] : [1, 0],
          },
        });

        // Add click handler
        map.current?.on("click", `fence-fill-${fence.id}`, () => {
          setSelectedItem({ type: "geofence", data: fence });
          onSelectFence?.(fence);
        });

        map.current?.on("mouseenter", `fence-fill-${fence.id}`, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = "pointer";
          }
        });

        map.current?.on("mouseleave", `fence-fill-${fence.id}`, () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = "";
          }
        });
      } catch (error) {
        console.error(`Error adding geofence ${fence.id}:`, error);
      }
    });
  }, [geofences, showGeofences, mapLoaded, selectedFenceId, breachedFenceId, onSelectFence]);

  // Handle map clicks for drawing
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!drawMode || !canEditGeofences) return;

    const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat];

    if (drawMode === "circle") {
      if (drawCoords.length === 0) {
        // First click: set center
        setDrawCoords([coord]);
      } else {
        // Second click: set radius
        const center = drawCoords[0];
        const radius = turf.distance(center, coord, { units: "meters" });
        
        onCreateFence?.({
          type: "circle",
          center,
          radius,
          status: "active",
          severity: "medium",
        });
        
        setDrawMode(null);
        setDrawCoords([]);
      }
    } else if (drawMode === "polygon") {
      setDrawCoords((prev) => [...prev, coord]);
    } else if (drawMode === "rectangle") {
      if (drawCoords.length === 0) {
        setDrawCoords([coord]);
      } else {
        const [first] = drawCoords;
        const coordinates: [number, number][] = [
          first,
          [coord[0], first[1]],
          coord,
          [first[0], coord[1]],
          first,
        ];
        
        onCreateFence?.({
          type: "rectangle",
          coordinates,
          status: "active",
          severity: "medium",
        });
        
        setDrawMode(null);
        setDrawCoords([]);
      }
    }
  }, [drawMode, drawCoords, canEditGeofences, onCreateFence]);

  // Complete polygon drawing on double-click
  useEffect(() => {
    if (!map.current) return;

    const handleDblClick = () => {
      if (drawMode === "polygon" && drawCoords.length >= 3) {
        onCreateFence?.({
          type: "polygon",
          coordinates: [...drawCoords, drawCoords[0]],
          status: "active",
          severity: "medium",
        });
        
        setDrawMode(null);
        setDrawCoords([]);
      }
    };

    map.current.on("dblclick", handleDblClick);
    return () => {
      map.current?.off("dblclick", handleDblClick);
    };
  }, [drawMode, drawCoords, onCreateFence]);

  // Cancel draw mode on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawMode(null);
        setDrawCoords([]);
        setSelectedItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Map controls
  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleCenter = () => {
    map.current?.flyTo({ center: defaultCenter, zoom: defaultZoom });
  };

  // Token input if no token provided
  if (!activeToken) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-border bg-muted", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Mapbox Token Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Mapbox public token to enable the real-world map.
              Get one at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
            </p>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm mb-3"
            />
            <Button
              onClick={() => setActiveToken(tokenInput)}
              disabled={!tokenInput.startsWith("pk.")}
              className="w-full"
            >
              Enable Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative rounded-xl overflow-hidden border border-border", className)}
      role="application"
      aria-label="Interactive geofence map. Use keyboard to navigate markers and controls."
    >
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Drawing Mode Overlay */}
      {drawMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-primary">
            <p className="text-foreground font-medium text-center">
              {drawMode === "circle" && (
                drawCoords.length === 0 
                  ? "Click to set center point" 
                  : "Click to set radius"
              )}
              {drawMode === "polygon" && "Click points to draw, double-click to finish"}
              {drawMode === "rectangle" && (
                drawCoords.length === 0 
                  ? "Click first corner" 
                  : "Click opposite corner"
              )}
            </p>
            <p className="text-muted-foreground text-sm text-center mt-1">Press Escape to cancel</p>
          </div>
        </div>
      )}

      {/* Drawing Tools - Left Side (Authority/Admin only) */}
      {canEditGeofences && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={drawMode === "circle" ? "default" : "outline"}
                size="icon"
                className="w-9 h-9 bg-card border-border shadow-sm"
                onClick={() => setDrawMode(drawMode === "circle" ? null : "circle")}
                aria-label="Draw circle fence"
              >
                <Circle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Draw Circle</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={drawMode === "polygon" ? "default" : "outline"}
                size="icon"
                className="w-9 h-9 bg-card border-border shadow-sm"
                onClick={() => setDrawMode(drawMode === "polygon" ? null : "polygon")}
                aria-label="Draw polygon fence"
              >
                <Pentagon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Draw Polygon</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={drawMode === "rectangle" ? "default" : "outline"}
                size="icon"
                className="w-9 h-9 bg-card border-border shadow-sm"
                onClick={() => setDrawMode(drawMode === "rectangle" ? null : "rectangle")}
                aria-label="Draw rectangle fence"
              >
                <Square className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Draw Rectangle</TooltipContent>
          </Tooltip>

          <div className="w-9 h-px bg-border my-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border shadow-sm"
                aria-label="Edit fence"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Edit Fence</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border shadow-sm text-destructive hover:text-destructive"
                onClick={() => {
                  if (selectedItem?.type === "geofence") {
                    onDeleteFence?.(selectedItem.data.id);
                    setSelectedItem(null);
                  }
                }}
                disabled={selectedItem?.type !== "geofence"}
                aria-label="Delete fence"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Delete Fence</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Map Controls - Right Side */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-card border-border shadow-sm"
              onClick={handleZoomIn}
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-card border-border shadow-sm"
              onClick={handleZoomOut}
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom Out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-card border-border shadow-sm"
              onClick={handleCenter}
              aria-label="Center map"
            >
              <Crosshair className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Center Map</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 bg-card border-border shadow-sm"
              onClick={() => setShowLayers(!showLayers)}
              aria-label="Toggle layers"
            >
              <Layers className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Layers</TooltipContent>
        </Tooltip>

        <div className="w-9 h-px bg-border my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "w-9 h-9 bg-card border-border shadow-sm",
                showTourists && "bg-primary/10 border-primary"
              )}
              onClick={() => setShowTourists(!showTourists)}
              aria-label="Toggle tourists"
            >
              <Users className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {showTourists ? "Hide" : "Show"} Tourists
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "w-9 h-9 bg-card border-border shadow-sm",
                showGeofences && "bg-primary/10 border-primary"
              )}
              onClick={() => setShowGeofences(!showGeofences)}
              aria-label="Toggle geofences"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {showGeofences ? "Hide" : "Show"} Geofences
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <div className="absolute top-4 right-16 bg-card border border-border rounded-lg shadow-lg p-4 z-30 min-w-[160px]">
          <p className="text-xs font-medium text-foreground mb-3">Map Style</p>
          <div className="space-y-2">
            <button
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                mapStyle === "streets" 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "hover:bg-muted text-foreground"
              )}
              onClick={() => setMapStyle("streets")}
            >
              Streets
            </button>
            <button
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                mapStyle === "satellite" 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "hover:bg-muted text-foreground"
              )}
              onClick={() => setMapStyle("satellite")}
            >
              Satellite
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 z-20">
        <p className="text-xs font-medium text-foreground mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.verified, border: "2px solid white" }} />
            <span className="text-muted-foreground">Verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.pending, border: "2px solid white" }} />
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.alert, border: "2px solid white" }} />
            <span className="text-muted-foreground">At Risk</span>
          </div>
          <div className="w-full h-px bg-border my-1" />
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded" style={{ border: `2px solid ${FENCE_TYPE_COLORS.safe_zone.border}`, backgroundColor: FENCE_TYPE_COLORS.safe_zone.fill }} />
            <span className="text-muted-foreground">Safe Zone</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded" style={{ border: `2px solid ${FENCE_TYPE_COLORS.restricted_zone.border}`, backgroundColor: FENCE_TYPE_COLORS.restricted_zone.fill }} />
            <span className="text-muted-foreground">Restricted</span>
          </div>
        </div>
      </div>

      {/* Role Indicator */}
      <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded px-3 py-1.5 z-20">
        <p className="text-xs text-muted-foreground capitalize">
          Role: <span className="font-medium text-foreground">{currentRole}</span>
        </p>
      </div>

      {/* Info Drawer */}
      <MapInfoDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={canEditGeofences && selectedItem?.type === "geofence" ? () => {
          // Navigate to edit
        } : undefined}
      />

      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {mapLoaded && `Map loaded with ${tourists.length} tourists and ${geofences.length} geofences`}
        {breachedFenceId && "Alert: Geofence breach detected"}
      </div>
    </div>
  );
}

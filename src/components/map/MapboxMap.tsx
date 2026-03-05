import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
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
  Users,
  MapPin,
} from "lucide-react";
import { MapTourist, MapGeofence, STATUS_COLORS, FENCE_TYPE_COLORS } from "./types";
import { MapInfoDrawer } from "./MapInfoDrawer";
import { supabase } from "@/integrations/supabase/client";

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
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { hasPermission, currentRole } = useRole();
  const canEditGeofences = hasPermission("canManageGeofence");

  const defaultCenter = { lat: 13.7563, lng: 100.5018 };
  const defaultZoom = 12;

  // Fetch API key from edge function
  useEffect(() => {
    async function fetchKey() {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-maps-key");
        if (fnError) throw fnError;
        if (data?.key) {
          setApiKey(data.key);
        } else {
          setError("Google Maps API key not configured");
        }
      } catch (err) {
        setError("Failed to load map configuration");
      } finally {
        setLoading(false);
      }
    }
    fetchKey();
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (!mapContainer.current || !apiKey || mapRef.current) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["marker", "drawing", "geometry"],
    });

    loader.importLibrary("maps").then(({ Map }) => {
      const map = new Map(mapContainer.current!, {
        center: defaultCenter,
        zoom: defaultZoom,
        mapId: "geofence-map",
        mapTypeId: mapStyle === "satellite" ? "satellite" : "roadmap",
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: "greedy",
        styles: mapStyle === "streets" ? [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "simplified" }] },
        ] : undefined,
      });

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        handleMapClick(e);
      });

      mapRef.current = map;
      setMapLoaded(true);
    }).catch(() => {
      setError("Failed to load Google Maps");
    });

    return () => {
      mapRef.current = null;
    };
  }, [apiKey]);

  // Update map type
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(mapStyle === "satellite" ? "satellite" : "roadmap");
  }, [mapStyle]);

  // Render tourist markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    if (!showTourists) return;

    tourists.forEach((tourist) => {
      const markerEl = document.createElement("div");
      markerEl.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        background-color: ${STATUS_COLORS[tourist.status]};
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.15s ease;
      `;
      markerEl.setAttribute("role", "button");
      markerEl.setAttribute("aria-label", `Tourist: ${tourist.name}, Status: ${tourist.status}`);

      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = "scale(1.3)";
        markerEl.style.boxShadow = `0 0 8px ${STATUS_COLORS[tourist.status]}`;
      });
      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.transform = "scale(1)";
        markerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
      });
      markerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedItem({ type: "tourist", data: tourist });
        onSelectTourist?.(tourist);
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current!,
        position: { lat: tourist.lat, lng: tourist.lng },
        content: markerEl,
        title: tourist.name,
      });

      markersRef.current.push(marker);
    });
  }, [tourists, showTourists, mapLoaded, onSelectTourist]);

  // Render geofences
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing polygons/circles
    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    if (!showGeofences) return;

    geofences.forEach((fence) => {
      const isBreached = breachedFenceId === fence.id;
      const isSelected = selectedFenceId === fence.id;
      const fenceType = fence.fenceType || "monitored_zone";
      const colors = isBreached
        ? { border: "#E25B4A", fill: "rgba(226, 91, 74, 0.15)" }
        : FENCE_TYPE_COLORS[fenceType] || FENCE_TYPE_COLORS.monitored_zone;

      if (fence.type === "circle" && fence.center && fence.radius) {
        const circle = new google.maps.Circle({
          map: mapRef.current!,
          center: { lat: fence.center[1], lng: fence.center[0] },
          radius: fence.radius,
          fillColor: colors.border,
          fillOpacity: fence.status === "inactive" ? 0.05 : 0.1,
          strokeColor: colors.border,
          strokeWeight: isSelected ? 3 : 2,
          strokeOpacity: 0.8,
          clickable: true,
        });

        circle.addListener("click", () => {
          setSelectedItem({ type: "geofence", data: fence });
          onSelectFence?.(fence);
        });

        circlesRef.current.push(circle);
      } else {
        let coords: google.maps.LatLngLiteral[] = [];

        if (fence.coordinates && fence.coordinates.length > 0) {
          coords = fence.coordinates.map((c) => ({ lat: c[1], lng: c[0] }));
        } else if (fence.center && fence.radius) {
          const turfCircle = turf.circle(fence.center, fence.radius / 1000, {
            steps: 64,
            units: "kilometers",
          });
          coords = (turfCircle.geometry.coordinates[0] as [number, number][]).map((c) => ({
            lat: c[1],
            lng: c[0],
          }));
        }

        if (coords.length === 0) return;

        const polygon = new google.maps.Polygon({
          map: mapRef.current!,
          paths: coords,
          fillColor: colors.border,
          fillOpacity: fence.status === "inactive" ? 0.05 : 0.1,
          strokeColor: colors.border,
          strokeWeight: isSelected ? 3 : 2,
          strokeOpacity: 0.8,
          clickable: true,
        });

        polygon.addListener("click", () => {
          setSelectedItem({ type: "geofence", data: fence });
          onSelectFence?.(fence);
        });

        polygonsRef.current.push(polygon);
      }
    });
  }, [geofences, showGeofences, mapLoaded, selectedFenceId, breachedFenceId, onSelectFence]);

  // Handle map clicks for drawing
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!drawMode || !canEditGeofences || !e.latLng) return;

      const coord: [number, number] = [e.latLng.lng(), e.latLng.lat()];

      if (drawMode === "circle") {
        if (drawCoords.length === 0) {
          setDrawCoords([coord]);
        } else {
          const center = drawCoords[0];
          const radius = turf.distance(center, coord, { units: "meters" });
          onCreateFence?.({ type: "circle", center, radius, status: "active", severity: "medium" });
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
          onCreateFence?.({ type: "rectangle", coordinates, status: "active", severity: "medium" });
          setDrawMode(null);
          setDrawCoords([]);
        }
      }
    },
    [drawMode, drawCoords, canEditGeofences, onCreateFence]
  );

  // Complete polygon on double-click
  useEffect(() => {
    if (!mapRef.current) return;

    const listener = mapRef.current.addListener("dblclick", () => {
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
    });

    return () => google.maps.event.removeListener(listener);
  }, [drawMode, drawCoords, onCreateFence]);

  // Cancel draw on Escape
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

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || defaultZoom) + 1);
  };
  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || defaultZoom) - 1);
  };
  const handleCenter = () => {
    mapRef.current?.panTo(defaultCenter);
    mapRef.current?.setZoom(defaultZoom);
  };

  // Loading / error states
  if (loading) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center", className)}>
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center", className)}>
        <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-lg text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative rounded-xl overflow-hidden border border-border", className)}
      role="application"
      aria-label="Interactive geofence map"
    >
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Drawing Mode Overlay */}
      {drawMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-card/95 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-primary">
            <p className="text-foreground font-medium text-center">
              {drawMode === "circle" && (drawCoords.length === 0 ? "Click to set center point" : "Click to set radius")}
              {drawMode === "polygon" && "Click points to draw, double-click to finish"}
              {drawMode === "rectangle" && (drawCoords.length === 0 ? "Click first corner" : "Click opposite corner")}
            </p>
            <p className="text-muted-foreground text-sm text-center mt-1">Press Escape to cancel</p>
          </div>
        </div>
      )}

      {/* Drawing Tools - Left Side */}
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
            <Button variant="outline" size="icon" className="w-9 h-9 bg-card border-border shadow-sm" onClick={handleZoomIn} aria-label="Zoom in">
              <Plus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="w-9 h-9 bg-card border-border shadow-sm" onClick={handleZoomOut} aria-label="Zoom out">
              <Minus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom Out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="w-9 h-9 bg-card border-border shadow-sm" onClick={handleCenter} aria-label="Center map">
              <Crosshair className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Center Map</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="w-9 h-9 bg-card border-border shadow-sm" onClick={() => setShowLayers(!showLayers)} aria-label="Toggle layers">
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
              className={cn("w-9 h-9 bg-card border-border shadow-sm", showTourists && "bg-primary/10 border-primary")}
              onClick={() => setShowTourists(!showTourists)}
              aria-label="Toggle tourists"
            >
              <Users className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{showTourists ? "Hide" : "Show"} Tourists</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn("w-9 h-9 bg-card border-border shadow-sm", showGeofences && "bg-primary/10 border-primary")}
              onClick={() => setShowGeofences(!showGeofences)}
              aria-label="Toggle geofences"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{showGeofences ? "Hide" : "Show"} Geofences</TooltipContent>
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
                mapStyle === "streets" ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground"
              )}
              onClick={() => setMapStyle("streets")}
            >
              Streets
            </button>
            <button
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                mapStyle === "satellite" ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground"
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
        onEdit={canEditGeofences && selectedItem?.type === "geofence" ? () => {} : undefined}
      />

      {/* Screen Reader Announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {mapLoaded && `Map loaded with ${tourists.length} tourists and ${geofences.length} geofences`}
        {breachedFenceId && "Alert: Geofence breach detected"}
      </div>
    </div>
  );
}

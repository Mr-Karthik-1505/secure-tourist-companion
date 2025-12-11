import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ZoomIn, ZoomOut, Locate, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import usersData from "@/data/users.json";

interface MapPin {
  id: string;
  name: string;
  status: "verified" | "pending" | "alert";
  location: { lat: number; lng: number };
  lastCheckIn: string;
  photo: string;
}

const mapPins: MapPin[] = usersData.slice(0, 3).map((user) => ({
  id: user.id,
  name: user.name,
  status: user.status as MapPin["status"],
  location: user.location,
  lastCheckIn: user.lastCheckIn,
  photo: user.photo,
}));

const statusColors = {
  verified: "bg-success",
  pending: "bg-warning",
  alert: "bg-destructive",
};

const statusLabels = {
  verified: "Verified",
  pending: "Pending",
  alert: "Alert",
};

interface InteractiveMapProps {
  onViewId?: (userId: string) => void;
  className?: string;
}

export function InteractiveMap({ onViewId, className }: InteractiveMapProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [focusedPinIndex, setFocusedPinIndex] = useState(-1);
  const [showLayers, setShowLayers] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.2, 0.5));
  }, []);

  const handleLocate = useCallback(() => {
    setZoom(1);
    setSelectedPin(null);
  }, []);

  const handlePinClick = (pin: MapPin) => {
    setSelectedPin(pin);
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % mapPins.length;
      setFocusedPinIndex(nextIndex);
      setSelectedPin(mapPins[nextIndex]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + mapPins.length) % mapPins.length;
      setFocusedPinIndex(prevIndex);
      setSelectedPin(mapPins[prevIndex]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedPin(mapPins[index]);
    } else if (e.key === "Escape") {
      setSelectedPin(null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pin positions on the map (percentage-based)
  const pinPositions = [
    { top: "35%", left: "40%" },
    { top: "55%", left: "60%" },
    { top: "45%", left: "25%" },
  ];

  return (
    <Card className={cn("relative overflow-hidden bg-gradient-to-br from-accent/5 to-primary/5", className)}>
      {/* Map Background */}
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* Grid pattern for map */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Simulated map areas */}
        <div className="absolute top-[20%] left-[30%] w-32 h-24 rounded-lg bg-primary/10 border border-primary/20" />
        <div className="absolute top-[50%] left-[50%] w-40 h-28 rounded-lg bg-accent/10 border border-accent/20" />
        <div className="absolute top-[30%] left-[60%] w-28 h-20 rounded-lg bg-success/10 border border-success/20" />

        {/* Map Pins */}
        {mapPins.map((pin, index) => (
          <Tooltip key={pin.id}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center",
                  "transition-all duration-200 focus-ring cursor-pointer",
                  "hover:scale-125 focus:scale-125",
                  statusColors[pin.status],
                  selectedPin?.id === pin.id && "ring-4 ring-primary/50 scale-125",
                  "map-pin-pulse"
                )}
                style={pinPositions[index]}
                onClick={() => handlePinClick(pin)}
                onKeyDown={(e) => handlePinKeyDown(e, index)}
                aria-label={`Tourist: ${pin.name} — status ${statusLabels[pin.status]}`}
                tabIndex={focusedPinIndex === index ? 0 : -1}
              >
                <img
                  src={pin.photo}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border-2 border-card"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{pin.name}</p>
              <p className="text-xs text-muted-foreground">Status: {statusLabels[pin.status]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="iconSm"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              className="bg-card shadow-md"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="iconSm"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              className="bg-card shadow-md"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom Out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="iconSm"
              onClick={handleLocate}
              aria-label="Reset location"
              className="bg-card shadow-md"
            >
              <Locate className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Locate Me</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showLayers ? "default" : "secondary"}
              size="iconSm"
              onClick={() => setShowLayers(!showLayers)}
              aria-label="Toggle layers"
              aria-pressed={showLayers}
              className={cn(!showLayers && "bg-card shadow-md")}
            >
              <Layers className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Toggle Layers</TooltipContent>
        </Tooltip>
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <div className="absolute top-4 left-4 bg-card rounded-lg shadow-lg p-3 animate-fade-in">
          <p className="text-xs font-medium text-foreground mb-2">Map Layers</p>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              Safe Zones
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              Tourists
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" className="rounded" />
              Incidents
            </label>
          </div>
        </div>
      )}

      {/* Selected Pin Panel */}
      {selectedPin && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 animate-slide-in-right"
          role="dialog"
          aria-label={`Details for ${selectedPin.name}`}
        >
          <div className="flex items-start gap-4">
            <img
              src={selectedPin.photo}
              alt={selectedPin.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground truncate">{selectedPin.name}</h4>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    selectedPin.status === "verified" && "status-verified",
                    selectedPin.status === "pending" && "status-pending",
                    selectedPin.status === "alert" && "status-alert"
                  )}
                >
                  {statusLabels[selectedPin.status]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Last check-in: {formatTime(selectedPin.lastCheckIn)}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onViewId?.(selectedPin.id)}
                >
                  View ID
                </Button>
                <Button size="sm" variant="outline">
                  Contact
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setSelectedPin(null)}
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

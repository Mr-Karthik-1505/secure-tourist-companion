import { useState, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  Crosshair,
  Layers,
  X,
  Phone,
  MessageSquare,
  Wallet,
  Loader2,
  Check,
  Clock,
  MapPin,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import usersData from "@/data/users.json";
import { useNavigate } from "react-router-dom";

interface MapPin {
  id: string;
  name: string;
  status: "verified" | "pending" | "alert";
  location: { lat: number; lng: number };
  lastCheckIn: string;
  photo: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

// Professional status configuration
const statusConfig = {
  verified: { 
    color: "hsl(156, 82%, 24%)", 
    label: "Verified",
    bgClass: "bg-primary",
  },
  pending: { 
    color: "hsl(38, 92%, 50%)", 
    label: "Pending",
    bgClass: "bg-warning",
  },
  alert: { 
    color: "hsl(8, 72%, 59%)", 
    label: "At Risk",
    bgClass: "bg-destructive",
  },
} as const;

interface InteractiveMapProps {
  onViewId?: (userId: string) => void;
  className?: string;
}

// Memoized marker component
const MarkerDot = memo(function MarkerDot({
  pin,
  position,
  isSelected,
  isFocused,
  onClick,
  onKeyDown,
  tabIndex,
}: {
  pin: MapPin;
  position: { top: string; left: string };
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
}) {
  const config = statusConfig[pin.status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          role="button"
          tabIndex={tabIndex}
          className={cn(
            "absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full",
            "border-2 border-card transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            "hover:scale-125",
            isSelected && "ring-2 ring-primary ring-offset-1 scale-125",
            isFocused && "ring-2 ring-ring ring-offset-1"
          )}
          style={{
            top: position.top,
            left: position.left,
            backgroundColor: config.color,
            boxShadow: isSelected
              ? `0 0 0 4px ${config.color}20`
              : "0 1px 3px rgba(0,0,0,0.12)",
          }}
          onClick={onClick}
          onKeyDown={onKeyDown}
          aria-label={`Tourist: ${pin.name}, Status: ${config.label}`}
        />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-card border border-border shadow-lg"
      >
        <div className="text-xs">
          <p className="font-medium text-foreground">{pin.name}</p>
          <p className="text-muted-foreground">Status: {config.label}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

export function InteractiveMap({ onViewId, className }: InteractiveMapProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(1);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [focusedPinIndex, setFocusedPinIndex] = useState(-1);
  const [showLayers, setShowLayers] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Map data
  const mapPins: MapPin[] = useMemo(() => 
    usersData.slice(0, 5).map((user) => ({
      id: user.id,
      name: user.name,
      status: user.status as MapPin["status"],
      location: user.location,
      lastCheckIn: user.lastCheckIn,
      photo: user.photo,
      emergencyContact: user.emergencyContact,
    })), []
  );

  // Calculate positions
  const pinPositions = useMemo(() => {
    if (!mapPins.length) return [];
    
    const minLat = Math.min(...mapPins.map((p) => p.location.lat));
    const maxLat = Math.max(...mapPins.map((p) => p.location.lat));
    const minLng = Math.min(...mapPins.map((p) => p.location.lng));
    const maxLng = Math.max(...mapPins.map((p) => p.location.lng));
    
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;

    return mapPins.map((pin) => ({
      top: `${15 + ((maxLat - pin.location.lat) / latRange) * 70}%`,
      left: `${15 + ((pin.location.lng - minLng) / lngRange) * 70}%`,
    }));
  }, [mapPins]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.5));
  }, []);

  const handleLocate = useCallback(() => {
    setZoom(1);
    setSelectedPin(null);
  }, []);

  const handlePinClick = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
  }, []);

  const handlePinKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
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
  }, [mapPins]);

  const handleContact = () => {
    setShowContactModal(true);
  };

  const handleMetaMaskConnect = () => {
    setShowMetaMaskModal(true);
  };

  const simulateMetaMaskConnection = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast({
        title: "Wallet Connected",
        description: "MetaMask wallet connected successfully.",
      });
    }, 2000);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Card className={cn("relative overflow-hidden bg-muted/30 border border-border", className)}>
        {/* Neutral Grayscale Map Background */}
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {/* Base map layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,0%,97%)] via-[hsl(0,0%,95%)] to-[hsl(200,10%,93%)]" />
          
          {/* Road grid */}
          <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="roadGridInteractive" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="hsl(0, 0%, 80%)" strokeWidth="1" />
              </pattern>
              <pattern id="minorGridInteractive" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(0, 0%, 88%)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#minorGridInteractive)" />
            <rect width="100%" height="100%" fill="url(#roadGridInteractive)" />
          </svg>

          {/* Water feature */}
          <div className="absolute top-[60%] right-[5%] w-[20%] h-[30%] rounded-lg bg-[hsl(200,15%,85%)] opacity-50" />
          
          {/* Block features */}
          <div className="absolute top-[20%] left-[30%] w-[15%] h-[12%] rounded bg-[hsl(0,0%,92%)]" />
          <div className="absolute top-[65%] left-[15%] w-[12%] h-[10%] rounded bg-[hsl(0,0%,91%)]" />

          {/* Map Pins */}
          {mapPins.map((pin, index) => (
            <MarkerDot
              key={pin.id}
              pin={pin}
              position={pinPositions[index]}
              isSelected={selectedPin?.id === pin.id}
              isFocused={focusedPinIndex === index}
              onClick={() => handlePinClick(pin)}
              onKeyDown={(e) => handlePinKeyDown(e, index)}
              tabIndex={focusedPinIndex === index ? 0 : -1}
            />
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 bg-card border-border hover:bg-muted shadow-sm"
                onClick={handleZoomIn}
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
                onClick={handleZoomOut}
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
                onClick={handleLocate}
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
                  showLayers && "bg-muted"
                )}
                onClick={() => setShowLayers(!showLayers)}
                aria-label="Toggle layers"
                aria-pressed={showLayers}
              >
                <Layers className="w-4 h-4 text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Toggle Layers</TooltipContent>
          </Tooltip>
        </div>

        {/* Layers Panel */}
        {showLayers && (
          <div className="absolute top-4 left-4 bg-card border border-border rounded-lg shadow-lg p-4 z-30 min-w-[160px]">
            <p className="text-xs font-medium text-foreground mb-3">Map Layers</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-border" />
                Safe Zones
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-border" />
                Tourists
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                Incidents
              </label>
            </div>
          </div>
        )}

        {/* Status Legend */}
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

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded px-2 py-1 z-20">
          <p className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</p>
        </div>

        {/* Selected Pin Panel - Slide from right */}
        {selectedPin && (
          <div
            className="absolute top-0 right-0 h-full w-[320px] bg-card border-l border-border shadow-xl z-40 animate-slide-in"
            role="dialog"
            aria-label={`Details for ${selectedPin.name}`}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusConfig[selectedPin.status].color }}
                  />
                  <h3 className="font-semibold text-foreground">{selectedPin.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedPin(null)}
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: statusConfig[selectedPin.status].color,
                        color: statusConfig[selectedPin.status].color,
                      }}
                    >
                      {statusConfig[selectedPin.status].label}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Location
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {selectedPin.location.lat.toFixed(4)}, {selectedPin.location.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Last Check-in
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{formatTime(selectedPin.lastCheckIn)}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="p-4 border-t border-border space-y-2">
                <Button
                  className="w-full justify-between"
                  variant="default"
                  onClick={() => {
                    onViewId?.(selectedPin.id);
                    navigate(`/my-id?user=${selectedPin.id}`);
                  }}
                >
                  View Digital ID
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  className="w-full justify-between"
                  variant="outline"
                  onClick={() => navigate(`/audit-log?user=${selectedPin.id}`)}
                >
                  View History
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  className="w-full justify-between"
                  variant="outline"
                  onClick={handleContact}
                >
                  Contact
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Contact Tourist
            </DialogTitle>
            <DialogDescription>
              Choose how you'd like to contact {selectedPin?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedPin && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusConfig[selectedPin.status].color }}
                />
                <div>
                  <p className="font-medium text-foreground">{selectedPin.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {statusConfig[selectedPin.status].label}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="w-4 h-4 mr-3" />
                  Call via Emergency Hotline
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Send SMS Alert
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleMetaMaskConnect}
                >
                  <Wallet className="w-4 h-4 mr-3" />
                  Connect via MetaMask
                </Button>
              </div>

              {selectedPin.emergencyContact && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Emergency Contact</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {selectedPin.emergencyContact.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPin.emergencyContact.relation}
                      </p>
                    </div>
                    <Button size="sm" variant="destructive">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MetaMask Modal */}
      <Dialog open={showMetaMaskModal} onOpenChange={setShowMetaMaskModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Connect MetaMask
            </DialogTitle>
            <DialogDescription>
              Connect your wallet to interact with the blockchain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-xl">
              {isConnecting ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground mt-4">
                    Connecting to MetaMask...
                  </p>
                </div>
              ) : isConnected ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground mt-4">Connected!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    0x7a3b...8f2d
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Click below to connect your MetaMask wallet
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowMetaMaskModal(false);
              setIsConnected(false);
            }}>
              Close
            </Button>
            {!isConnected && (
              <Button onClick={simulateMetaMaskConnection} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

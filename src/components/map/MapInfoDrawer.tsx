import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  X,
  User,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  History,
  Pencil,
  ExternalLink,
  Phone,
} from "lucide-react";
import { MapTourist, MapGeofence, STATUS_COLORS } from "./types";

interface MapInfoDrawerProps {
  item: {
    type: "tourist" | "geofence";
    data: MapTourist | MapGeofence;
  } | null;
  onClose: () => void;
  onEdit?: () => void;
}

export function MapInfoDrawer({ item, onClose, onEdit }: MapInfoDrawerProps) {
  const navigate = useNavigate();

  if (!item) return null;

  const isTourist = item.type === "tourist";
  const tourist = isTourist ? (item.data as MapTourist) : null;
  const geofence = !isTourist ? (item.data as MapGeofence) : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return { label: "Low", color: "text-green-600" };
    if (score < 60) return { label: "Medium", color: "text-amber-600" };
    return { label: "High", color: "text-red-600" };
  };

  return (
    <div
      className={cn(
        "absolute top-0 right-0 h-full w-[380px] bg-card border-l border-border shadow-xl z-40",
        "transform transition-transform duration-300 ease-out",
        item ? "translate-x-0" : "translate-x-full"
      )}
      role="dialog"
      aria-label={isTourist ? `Tourist details: ${tourist?.name}` : `Geofence details: ${geofence?.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isTourist ? "bg-primary/10" : "bg-muted"
            )}
          >
            {isTourist ? (
              <User className="w-5 h-5 text-primary" />
            ) : (
              <MapPin className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isTourist ? tourist?.name : geofence?.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isTourist ? "Tourist" : "Geofence"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100%-70px)]">
        {isTourist && tourist && (
          <>
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="capitalize"
                style={{
                  borderColor: STATUS_COLORS[tourist.status],
                  color: STATUS_COLORS[tourist.status],
                }}
              >
                {tourist.status}
              </Badge>
              {tourist.country && (
                <span className="text-sm text-muted-foreground">{tourist.country}</span>
              )}
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Last Known Location
              </h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-mono text-foreground">
                  {tourist.lat.toFixed(6)}, {tourist.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Last Check-in */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Last Check-in
              </h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(tourist.lastUpdated)}
              </p>
            </div>

            {/* Risk Assessment */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                Risk Assessment
              </h4>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-foreground">
                  {tourist.riskScore}
                </div>
                <div className={cn("text-sm font-medium", getRiskLabel(tourist.riskScore).color)}>
                  {getRiskLabel(tourist.riskScore).label} Risk
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    tourist.riskScore < 30 ? "bg-green-500" :
                    tourist.riskScore < 60 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${tourist.riskScore}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/my-id?user=${tourist.id}`)}
              >
                <Shield className="w-4 h-4 mr-2" />
                View Digital ID
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/audit-log?user=${tourist.id}`)}
              >
                <History className="w-4 h-4 mr-2" />
                View History
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              <Button
                variant="default"
                className="w-full justify-start bg-destructive hover:bg-destructive/90"
                onClick={() => navigate("/alerts")}
              >
                <Phone className="w-4 h-4 mr-2" />
                Dispatch Help
              </Button>
            </div>
          </>
        )}

        {!isTourist && geofence && (
          <>
            {/* Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  geofence.status === "active" && "border-green-500 text-green-600",
                  geofence.status === "inactive" && "border-gray-400 text-gray-500",
                  geofence.status === "breached" && "border-red-500 text-red-600",
                  geofence.status === "scheduled" && "border-blue-500 text-blue-600"
                )}
              >
                {geofence.status}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "capitalize",
                  geofence.severity === "low" && "bg-green-100 text-green-700",
                  geofence.severity === "medium" && "bg-amber-100 text-amber-700",
                  geofence.severity === "high" && "bg-red-100 text-red-700"
                )}
              >
                {geofence.severity} severity
              </Badge>
            </div>

            {/* Fence Type */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Shape Type</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {geofence.type}
              </p>
            </div>

            {/* Area Coverage */}
            {geofence.radius && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Area Coverage</h4>
                <p className="text-sm text-muted-foreground">
                  Radius: {geofence.radius.toLocaleString()}m
                </p>
              </div>
            )}

            {/* Center Coordinates */}
            {geofence.center && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Center</h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-mono text-foreground">
                    {geofence.center[1].toFixed(6)}, {geofence.center[0].toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {geofence.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {geofence.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-border">
              {onEdit && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={onEdit}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Fence
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/geofence/history/${geofence.id}`)}
              >
                <History className="w-4 h-4 mr-2" />
                View History
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

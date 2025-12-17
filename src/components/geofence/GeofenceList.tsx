import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Settings,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Geofence {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  activeIncidents: number;
  totalTourists: number;
  status?: string;
}

interface GeofenceListProps {
  geofences: Geofence[];
  selectedFenceId: string | null;
  onSelectFence: (fence: Geofence) => void;
  onToggleFence: (id: string) => void;
  onCreateNew: () => void;
  onOpenSettings: (fence: Geofence) => void;
}

const typeLabels: Record<string, string> = {
  safe_zone: "Safe Zone",
  monitored_zone: "Monitored Zone",
  restricted_zone: "Restricted Zone",
  transport_hub: "Transport Hub",
};

const typeColors: Record<string, string> = {
  safe_zone: "bg-primary",
  monitored_zone: "bg-accent",
  restricted_zone: "bg-destructive",
  transport_hub: "bg-primary",
};

export function GeofenceList({
  geofences,
  selectedFenceId,
  onSelectFence,
  onToggleFence,
  onCreateNew,
  onOpenSettings,
}: GeofenceListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFences = geofences.filter(
    (fence) =>
      fence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fence.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="p-4 h-full flex flex-col">
      {/* Create Button */}
      <Button
        onClick={onCreateNew}
        className="w-full mb-4 h-10"
        aria-label="Create new geofence"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Geo-Fence
      </Button>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search fence by name or ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          aria-label="Search geofences"
        />
      </div>

      {/* Fence List */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2">
          {filteredFences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No geofences found
            </p>
          ) : (
            filteredFences.map((fence) => (
              <button
                key={fence.id}
                className={cn(
                  "w-full p-3 rounded-lg border transition-all text-left h-[72px] focus-ring",
                  "hover:border-primary/50 hover:shadow-sm",
                  selectedFenceId === fence.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : fence.enabled
                    ? "bg-card border-border"
                    : "bg-muted/30 border-border/50"
                )}
                onClick={() => onSelectFence(fence)}
                aria-label={`${fence.name}, ${typeLabels[fence.type]}, ${
                  fence.enabled ? "enabled" : "disabled"
                }`}
                aria-selected={selectedFenceId === fence.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full flex-shrink-0",
                          typeColors[fence.type] || "bg-muted"
                        )}
                        aria-hidden="true"
                      />
                      <p className="font-medium text-foreground text-sm truncate">
                        {fence.name}
                      </p>
                      {fence.status === "scheduled" && (
                        <Clock className="w-3 h-3 text-warning flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-4.5">
                      {typeLabels[fence.type]}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 ml-4.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" aria-hidden="true" />
                        <span>{fence.totalTourists}</span>
                      </span>
                      {fence.activeIncidents > 0 && (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                          <span>{fence.activeIncidents}</span>
                        </span>
                      )}
                      {fence.enabled && fence.activeIncidents === 0 && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex flex-col items-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={fence.enabled}
                      onCheckedChange={() => onToggleFence(fence.id)}
                      aria-label={`Toggle ${fence.name} ${fence.enabled ? "off" : "on"}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSettings(fence);
                      }}
                      aria-label={`Open settings for ${fence.name}`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="pt-4 mt-4 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total: {geofences.length}</span>
          <span>Active: {geofences.filter((f) => f.enabled).length}</span>
        </div>
      </div>
    </Card>
  );
}

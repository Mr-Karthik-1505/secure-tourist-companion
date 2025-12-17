import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  History,
  Plus,
  Edit,
  Power,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";

interface HistoryEvent {
  id: string;
  type: "created" | "modified" | "activated" | "deactivated" | "breach";
  timestamp: string;
  description: string;
  details?: string;
  user?: string;
}

interface FenceHistoryModalProps {
  fenceId: string | null;
  fenceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock history data
const generateMockHistory = (fenceId: string): HistoryEvent[] => [
  {
    id: "evt_001",
    type: "created",
    timestamp: "2024-01-15T09:30:00Z",
    description: "Geofence created",
    details: "Initial boundary set with 4 vertices",
    user: "admin@tourism.gov.th",
  },
  {
    id: "evt_002",
    type: "modified",
    timestamp: "2024-01-20T14:15:00Z",
    description: "Boundary updated",
    details: "Radius increased from 500m to 750m",
    user: "operator@tourism.gov.th",
  },
  {
    id: "evt_003",
    type: "activated",
    timestamp: "2024-01-25T08:00:00Z",
    description: "Fence activated",
    details: "Scheduled activation",
  },
  {
    id: "evt_004",
    type: "breach",
    timestamp: "2024-02-01T23:45:00Z",
    description: "Breach detected",
    details: "Tourist ID: usr_002 entered restricted zone after hours",
  },
  {
    id: "evt_005",
    type: "deactivated",
    timestamp: "2024-02-05T18:00:00Z",
    description: "Fence deactivated",
    details: "Maintenance period",
    user: "admin@tourism.gov.th",
  },
  {
    id: "evt_006",
    type: "modified",
    timestamp: "2024-02-10T11:30:00Z",
    description: "Alert rules updated",
    details: "Added after-hours breach notification",
    user: "operator@tourism.gov.th",
  },
  {
    id: "evt_007",
    type: "activated",
    timestamp: "2024-02-10T12:00:00Z",
    description: "Fence reactivated",
    details: "Maintenance complete",
    user: "admin@tourism.gov.th",
  },
];

const eventIcons: Record<string, typeof Plus> = {
  created: Plus,
  modified: Edit,
  activated: Power,
  deactivated: Power,
  breach: AlertTriangle,
};

const eventColors: Record<string, string> = {
  created: "bg-primary text-primary-foreground",
  modified: "bg-accent text-accent-foreground",
  activated: "bg-success text-success-foreground",
  deactivated: "bg-muted text-muted-foreground",
  breach: "bg-destructive text-destructive-foreground",
};

export function FenceHistoryModal({
  fenceId,
  fenceName,
  open,
  onOpenChange,
}: FenceHistoryModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  const history = fenceId ? generateMockHistory(fenceId) : [];

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Fence History
          </DialogTitle>
          <DialogDescription>
            Activity timeline for {fenceName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Events */}
            <div className="space-y-4">
              {history.map((event, index) => {
                const Icon = eventIcons[event.type] || Clock;
                const isSelected = selectedEvent?.id === event.id;

                return (
                  <button
                    key={event.id}
                    className={cn(
                      "w-full relative pl-10 pr-4 py-3 rounded-lg text-left transition-all",
                      "hover:bg-muted/50 focus-ring",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => setSelectedEvent(isSelected ? null : event)}
                    aria-expanded={isSelected}
                  >
                    {/* Icon Badge */}
                    <div
                      className={cn(
                        "absolute left-1.5 top-3 w-5 h-5 rounded-full flex items-center justify-center",
                        eventColors[event.type]
                      )}
                    >
                      <Icon className="w-3 h-3" />
                    </div>

                    {/* Content */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {event.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                        </p>
                      </div>

                      {event.type === "breach" && (
                        <span className="px-2 py-0.5 text-xs rounded bg-destructive/10 text-destructive">
                          Alert
                        </span>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-border animate-fade-in-up">
                        {event.details && (
                          <p className="text-sm text-muted-foreground">
                            {event.details}
                          </p>
                        )}
                        {event.user && (
                          <p className="text-xs text-muted-foreground mt-2">
                            By: {event.user}
                          </p>
                        )}
                        {event.type === "breach" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to alert detail
                            }}
                          >
                            View Incident
                          </Button>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {history.filter((e) => e.type === "modified").length}
            </p>
            <p className="text-xs text-muted-foreground">Modifications</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">
              {history.filter((e) => e.type === "breach").length}
            </p>
            <p className="text-xs text-muted-foreground">Breaches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {Math.ceil((Date.now() - new Date(history[0]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

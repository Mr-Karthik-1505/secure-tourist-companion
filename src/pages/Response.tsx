import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  MapPin,
  Clock,
  User,
  GripVertical,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import incidentsData from "@/data/incidents.json";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  location: { name: string; lat: number; lng: number };
  timestamp: string;
  description: string;
  affectedUser: string;
}

type ColumnId = "reported" | "assigned" | "responding" | "resolved";

const columns: { id: ColumnId; title: string; color: string }[] = [
  { id: "reported", title: "Reported", color: "bg-destructive" },
  { id: "assigned", title: "Assigned", color: "bg-warning" },
  { id: "responding", title: "Responding", color: "bg-accent" },
  { id: "resolved", title: "Resolved", color: "bg-success" },
];

const responders = [
  "Officer Somchai",
  "Medical Team Alpha",
  "Security Unit 3",
  "Tourist Police",
];

const severityColors: Record<string, string> = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-muted-foreground",
};

export default function Response() {
  const location = useLocation();
  const { toast } = useToast();
  const highlightColumn = (location.state as { highlight?: string })?.highlight;

  const [incidents, setIncidents] = useState<Incident[]>(incidentsData as Incident[]);
  const [draggedIncident, setDraggedIncident] = useState<Incident | null>(null);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const getIncidentsByStatus = useCallback(
    (status: ColumnId) => incidents.filter((inc) => inc.status === status),
    [incidents]
  );

  const handleDragStart = (e: React.DragEvent, incident: Incident) => {
    setDraggedIncident(incident);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ColumnId) => {
    e.preventDefault();
    if (draggedIncident && draggedIncident.status !== targetStatus) {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === draggedIncident.id ? { ...inc, status: targetStatus } : inc
        )
      );
      toast({
        title: "Incident Updated",
        description: `${draggedIncident.title} moved to ${targetStatus}.`,
      });
    }
    setDraggedIncident(null);
  };

  const handleAssign = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowAssignSheet(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 24) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return "Just now";
    }
  };

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Incident Response</h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop to manage incident workflow
          </p>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const columnIncidents = getIncidentsByStatus(column.id);
            const isHighlighted = highlightColumn === column.id;

            return (
              <div
                key={column.id}
                className={cn(
                  "rounded-xl transition-all",
                  isHighlighted && "ring-2 ring-primary ring-offset-2"
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("w-3 h-3 rounded-full", column.color)} />
                  <h2 className="font-semibold text-foreground">{column.title}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {columnIncidents.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[400px] bg-muted/30 rounded-lg p-3">
                  {columnIncidents.map((incident) => (
                    <Card
                      key={incident.id}
                      className={cn(
                        "p-3 cursor-grab active:cursor-grabbing transition-all",
                        "hover:shadow-md border-l-4",
                        severityColors[incident.severity],
                        draggedIncident?.id === incident.id && "opacity-50"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, incident)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm line-clamp-2">
                            {incident.title}
                          </h3>

                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{incident.location.name}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(incident.timestamp)}</span>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleAssign(incident)}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Assign
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {columnIncidents.length === 0 && (
                    <div className="h-full min-h-[200px] flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        Drop incidents here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <Card className="mt-8 p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-foreground">Severity:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-4 border-destructive bg-muted" />
              <span className="text-sm text-muted-foreground">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-4 border-warning bg-muted" />
              <span className="text-sm text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-4 border-muted-foreground bg-muted" />
              <span className="text-sm text-muted-foreground">Low</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Assign Sheet */}
      <Sheet open={showAssignSheet} onOpenChange={setShowAssignSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Assign Incident
            </SheetTitle>
            <SheetDescription>
              Assign responders and update incident details.
            </SheetDescription>
          </SheetHeader>

          {selectedIncident && (
            <div className="space-y-6 mt-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground">{selectedIncident.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIncident.location.name}
                </p>
              </div>

              <div>
                <Label>Assign Responder</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select responder" />
                  </SelectTrigger>
                  <SelectContent>
                    {responders.map((responder) => (
                      <SelectItem key={responder} value={responder}>
                        {responder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority Override</Label>
                <Select defaultValue={selectedIncident.severity}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Move to Status</Label>
                <Select defaultValue={selectedIncident.status}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast({
                      title: "Assignment Saved",
                      description: "Incident has been updated.",
                    });
                    setShowAssignSheet(false);
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignSheet(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}

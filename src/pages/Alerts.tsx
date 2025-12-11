import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  Filter,
  MapPin,
  Clock,
  Eye,
  Send,
  Check,
  Phone,
  Ambulance,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import incidentsData from "@/data/incidents.json";
import geofencesData from "@/data/geofences.json";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  location: { name: string; lat: number; lng: number };
  timestamp: string;
  description: string;
  affectedUser: string;
  geofenceId: string;
  responders: string[];
  timeline: { time: string; event: string }[];
  attachments: string[];
}

const severityColors: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  reported: "bg-destructive/10 text-destructive border-destructive/20",
  assigned: "bg-warning/10 text-warning border-warning/20",
  responding: "bg-accent/10 text-accent border-accent/20",
  resolved: "bg-success/10 text-success border-success/20",
};

export default function Alerts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const initialFilter = (location.state as { filter?: string })?.filter || "all";
  
  const [incidents] = useState<Incident[]>(incidentsData as Incident[]);
  const [severityFilter, setSeverityFilter] = useState(initialFilter);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const handleViewDetails = (id: string) => {
    navigate(`/alerts/${id}`);
  };

  const handleDispatch = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = () => {
    toast({
      title: "Emergency Dispatched",
      description: "Responders have been notified and are en route.",
    });
    setShowDispatchModal(false);
    setSelectedIncident(null);
  };

  const handleAcknowledge = (incident: Incident) => {
    toast({
      title: "Incident Acknowledged",
      description: `${incident.title} has been acknowledged.`,
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  const getGeofenceName = (id: string) => {
    const fence = geofencesData.find((g) => g.id === id);
    return fence?.name || "Unknown";
  };

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Safety Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Real-time incident monitoring and response
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              {incidents.filter((i) => i.status !== "resolved").length} Active
            </Badge>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Incidents List */}
          <div className="flex-1">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Incidents */}
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className={cn(
                    "p-4 transition-all hover:shadow-md",
                    incident.severity === "high" && "border-l-4 border-l-destructive"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        incident.severity === "high" && "bg-destructive/10",
                        incident.severity === "medium" && "bg-warning/10",
                        incident.severity === "low" && "bg-muted"
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "w-5 h-5",
                          incident.severity === "high" && "text-destructive",
                          incident.severity === "medium" && "text-warning",
                          incident.severity === "low" && "text-muted-foreground"
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {incident.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusColors[incident.status])}
                        >
                          {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {incident.description}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {incident.location.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(incident.timestamp)}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleViewDetails(incident.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDispatch(incident)}
                          disabled={incident.status === "resolved"}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Dispatch
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAcknowledge(incident)}
                          disabled={incident.status !== "reported"}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      </div>
                    </div>

                    <Badge className={cn("shrink-0", severityColors[incident.severity])}>
                      {incident.severity.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))}

              {filteredIncidents.length === 0 && (
                <Card className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Incidents Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search query.
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Filters Sidebar */}
          <div className="w-full lg:w-72">
            <Card className="p-4 sticky top-24">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4" />
                Filters
              </h3>

              <div className="space-y-4">
                <div>
                  <Label>Severity</Label>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="responding">Responding</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <Input type="date" className="mt-1" />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSeverityFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      <Dialog open={showDispatchModal} onOpenChange={setShowDispatchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ambulance className="w-5 h-5" />
              Emergency Dispatch
            </DialogTitle>
            <DialogDescription>
              Dispatch emergency responders to this incident.
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                <p className="font-semibold text-foreground">{selectedIncident.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIncident.location.name}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Select Response Team</Label>
                <div className="space-y-2">
                  {["Medical Team Alpha", "Security Unit 3", "Tourist Police"].map((team) => (
                    <label
                      key={team}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                    >
                      <input type="checkbox" className="rounded" defaultChecked={team === "Medical Team Alpha"} />
                      <span className="text-sm text-foreground">{team}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispatchModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDispatch}>
              <Phone className="w-4 h-4 mr-2" />
              Dispatch Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

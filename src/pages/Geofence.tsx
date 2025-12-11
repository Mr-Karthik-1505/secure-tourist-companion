import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MapPin,
  Plus,
  Settings,
  Trash2,
  Users,
  AlertTriangle,
  Eye,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import geofencesData from "@/data/geofences.json";

interface Geofence {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  color: string;
  vertices: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  autoNotify: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  contacts: string[];
  activeIncidents: number;
  totalTourists: number;
}

const typeLabels: Record<string, string> = {
  safe_zone: "Safe Zone",
  monitored_zone: "Monitored Zone",
  restricted_zone: "Restricted Zone",
  transport_hub: "Transport Hub",
};

export default function Geofence() {
  const { toast } = useToast();
  const [geofences, setGeofences] = useState<Geofence[]>(geofencesData as Geofence[]);
  const [selectedFence, setSelectedFence] = useState<Geofence | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  const [newFence, setNewFence] = useState({
    name: "",
    description: "",
    type: "safe_zone",
    lat: "",
    lng: "",
  });

  const handleToggleFence = (id: string) => {
    setGeofences((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
    toast({
      title: "Geofence Updated",
      description: "Fence status has been toggled.",
    });
  };

  const handleSelectFence = (fence: Geofence) => {
    setSelectedFence(fence);
    setShowSettingsSheet(true);
  };

  const handleSaveSettings = () => {
    if (selectedFence) {
      setGeofences((prev) =>
        prev.map((f) => (f.id === selectedFence.id ? selectedFence : f))
      );
      toast({
        title: "Settings Saved",
        description: `${selectedFence.name} settings have been updated.`,
      });
      setShowSettingsSheet(false);
    }
  };

  const handleCreateFence = () => {
    if (!newFence.name.trim() || !newFence.lat || !newFence.lng) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const lat = parseFloat(newFence.lat);
    const lng = parseFloat(newFence.lng);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }

    const newGeofence: Geofence = {
      id: `geo_${Date.now()}`,
      name: newFence.name,
      description: newFence.description,
      type: newFence.type,
      enabled: true,
      color: "#0B6E4F",
      vertices: [
        { lat: lat + 0.01, lng: lng - 0.01 },
        { lat: lat + 0.01, lng: lng + 0.01 },
        { lat: lat - 0.01, lng: lng + 0.01 },
        { lat: lat - 0.01, lng: lng - 0.01 },
      ],
      center: { lat, lng },
      autoNotify: true,
      notifyOnEntry: true,
      notifyOnExit: true,
      contacts: [],
      activeIncidents: 0,
      totalTourists: 0,
    };

    setGeofences((prev) => [...prev, newGeofence]);
    setNewFence({ name: "", description: "", type: "safe_zone", lat: "", lng: "" });
    setShowCreateModal(false);
    toast({
      title: "Geofence Created",
      description: `${newFence.name} has been added to the map.`,
    });
  };

  const handleDeleteFence = (id: string) => {
    setGeofences((prev) => prev.filter((f) => f.id !== id));
    setShowSettingsSheet(false);
    toast({
      title: "Geofence Deleted",
      description: "The geofence has been removed.",
    });
  };

  // Calculate position for fence polygon on the map visualization
  const getFencePosition = (fence: Geofence, index: number) => {
    // Distribute fences across the map
    const positions = [
      { top: "15%", left: "20%", width: "25%", height: "30%" },
      { top: "60%", left: "55%", width: "30%", height: "25%" },
      { top: "45%", left: "10%", width: "20%", height: "20%" },
      { top: "20%", left: "60%", width: "25%", height: "25%" },
      { top: "55%", left: "30%", width: "22%", height: "28%" },
    ];
    return positions[index % positions.length];
  };

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Map Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Geofence Management</h1>
                <p className="text-muted-foreground mt-1">
                  Define and manage safety boundaries
                </p>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Geofence
              </Button>
            </div>

            {/* Map Visualization */}
            <Card className="relative h-[500px] overflow-hidden bg-gradient-to-br from-accent/5 to-primary/5">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#mapGrid)" />
                </svg>
              </div>

              {/* Fence polygons */}
              {geofences.map((fence, index) => {
                const pos = getFencePosition(fence, index);
                return (
                  <button
                    key={fence.id}
                    className={cn(
                      "absolute rounded-xl border-2 transition-all duration-300 cursor-pointer",
                      "hover:shadow-lg focus-ring",
                      fence.enabled ? "opacity-100" : "opacity-40",
                      fence.type === "restricted_zone"
                        ? "border-destructive bg-destructive/10"
                        : fence.type === "safe_zone"
                        ? "border-primary bg-primary/10"
                        : "border-accent bg-accent/10"
                    )}
                    style={{
                      top: pos.top,
                      left: pos.left,
                      width: pos.width,
                      height: pos.height,
                    }}
                    onClick={() => handleSelectFence(fence)}
                    aria-label={`${fence.name}: ${fence.description}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-2">
                        <MapPin
                          className={cn(
                            "w-6 h-6 mx-auto mb-1",
                            fence.type === "restricted_zone"
                              ? "text-destructive"
                              : fence.type === "safe_zone"
                              ? "text-primary"
                              : "text-accent"
                          )}
                        />
                        <p className="text-xs font-medium text-foreground truncate max-w-[100px]">
                          {fence.name}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Map legend */}
              <div className="absolute bottom-4 left-4 bg-card rounded-lg shadow-lg p-3">
                <p className="text-xs font-medium text-foreground mb-2">Legend</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-muted-foreground">Safe Zone</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-accent" />
                    <span className="text-muted-foreground">Monitored</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-destructive" />
                    <span className="text-muted-foreground">Restricted</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Fence List */}
          <div className="w-full lg:w-80">
            <Card className="p-4">
              <h2 className="font-semibold text-foreground mb-4">Geofence List</h2>
              <div className="space-y-3">
                {geofences.map((fence) => (
                  <div
                    key={fence.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      fence.enabled
                        ? "bg-card border-border"
                        : "bg-muted/50 border-border/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              fence.type === "restricted_zone"
                                ? "bg-destructive"
                                : fence.type === "safe_zone"
                                ? "bg-primary"
                                : "bg-accent"
                            )}
                          />
                          <p className="font-medium text-foreground text-sm truncate">
                            {fence.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {typeLabels[fence.type]}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {fence.totalTourists}
                          </span>
                          {fence.activeIncidents > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertTriangle className="w-3 h-3" />
                              {fence.activeIncidents}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Switch
                          checked={fence.enabled}
                          onCheckedChange={() => handleToggleFence(fence.id)}
                          aria-label={`Toggle ${fence.name}`}
                        />
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => handleSelectFence(fence)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Geofence Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Create New Geofence
            </DialogTitle>
            <DialogDescription>
              Define a new safety boundary on the map.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fenceName">Name *</Label>
              <Input
                id="fenceName"
                value={newFence.name}
                onChange={(e) => setNewFence((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Beach Safety Zone"
              />
            </div>

            <div>
              <Label htmlFor="fenceDesc">Description</Label>
              <Input
                id="fenceDesc"
                value={newFence.description}
                onChange={(e) => setNewFence((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Center Latitude *</Label>
                <Input
                  id="lat"
                  value={newFence.lat}
                  onChange={(e) => setNewFence((prev) => ({ ...prev, lat: e.target.value }))}
                  placeholder="13.7563"
                />
              </div>
              <div>
                <Label htmlFor="lng">Center Longitude *</Label>
                <Input
                  id="lng"
                  value={newFence.lng}
                  onChange={(e) => setNewFence((prev) => ({ ...prev, lng: e.target.value }))}
                  placeholder="100.5018"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFence}>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Sheet */}
      <Sheet open={showSettingsSheet} onOpenChange={setShowSettingsSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Geofence Settings
            </SheetTitle>
            <SheetDescription>
              Configure fence behavior and notifications.
            </SheetDescription>
          </SheetHeader>

          {selectedFence && (
            <div className="space-y-6 mt-6">
              <div>
                <Label htmlFor="editName">Name</Label>
                <Input
                  id="editName"
                  value={selectedFence.name}
                  onChange={(e) =>
                    setSelectedFence((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor="editDesc">Description</Label>
                <Input
                  id="editDesc"
                  value={selectedFence.description}
                  onChange={(e) =>
                    setSelectedFence((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Notifications</h4>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autoNotify">Auto-Notify</Label>
                  <Switch
                    id="autoNotify"
                    checked={selectedFence.autoNotify}
                    onCheckedChange={(checked) =>
                      setSelectedFence((prev) =>
                        prev ? { ...prev, autoNotify: checked } : null
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyEntry">Notify on Entry</Label>
                  <Switch
                    id="notifyEntry"
                    checked={selectedFence.notifyOnEntry}
                    onCheckedChange={(checked) =>
                      setSelectedFence((prev) =>
                        prev ? { ...prev, notifyOnEntry: checked } : null
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyExit">Notify on Exit</Label>
                  <Switch
                    id="notifyExit"
                    checked={selectedFence.notifyOnExit}
                    onCheckedChange={(checked) =>
                      setSelectedFence((prev) =>
                        prev ? { ...prev, notifyOnExit: checked } : null
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Contacts</Label>
                <div className="mt-2 space-y-1">
                  {selectedFence.contacts.map((contact, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {contact}
                    </p>
                  ))}
                  {selectedFence.contacts.length === 0 && (
                    <p className="text-sm text-muted-foreground">No contacts configured</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Vertices ({selectedFence.vertices.length})</Label>
                <div className="mt-2 bg-muted/50 rounded-lg p-3 text-xs">
                  {selectedFence.vertices.map((v, i) => (
                    <p key={i} className="text-muted-foreground">
                      Point {i + 1}: {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button className="flex-1" onClick={handleSaveSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteFence(selectedFence.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}

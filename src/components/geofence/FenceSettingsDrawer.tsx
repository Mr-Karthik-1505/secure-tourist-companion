import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Settings,
  MapPin,
  Clock,
  Bell,
  Users,
  Save,
  Trash2,
  History,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vertex {
  lat: number;
  lng: number;
}

interface Geofence {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  color: string;
  vertices: Vertex[];
  center: { lat: number; lng: number };
  autoNotify: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  contacts: string[];
  activeIncidents: number;
  totalTourists: number;
  fenceType?: "circle" | "polygon";
  radius?: number;
  scheduled?: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  scheduleDays?: string[];
  severity?: "low" | "medium" | "high";
  linkedTourists?: string[];
}

interface FenceSettingsDrawerProps {
  fence: Geofence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (fence: Geofence) => void;
  onDelete: (id: string) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Mock linked tourists for demo
const mockTourists = [
  { id: "usr_001", name: "Sarah Chen" },
  { id: "usr_002", name: "James Wilson" },
  { id: "usr_003", name: "Maria Santos" },
  { id: "usr_004", name: "Ahmed Hassan" },
];

export function FenceSettingsDrawer({
  fence,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: FenceSettingsDrawerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editedFence, setEditedFence] = useState<Geofence | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (fence) {
      setEditedFence({
        ...fence,
        scheduled: fence.scheduled ?? false,
        scheduleDays: fence.scheduleDays ?? [],
        severity: fence.severity ?? "medium",
        linkedTourists: fence.linkedTourists ?? [],
      });
    }
  }, [fence]);

  const updateFence = (updates: Partial<Geofence>) => {
    if (editedFence) {
      setEditedFence({ ...editedFence, ...updates });
    }
  };

  const handleSave = () => {
    if (editedFence) {
      onSave(editedFence);
    }
  };

  const handleCopyId = () => {
    if (editedFence) {
      navigator.clipboard.writeText(editedFence.id);
      toast({
        title: "Copied",
        description: "Fence ID copied to clipboard",
      });
    }
  };

  const handleViewHistory = () => {
    if (editedFence) {
      navigate(`/geofence/history/${editedFence.id}`);
      onOpenChange(false);
    }
  };

  const handleViewTourist = (touristId: string) => {
    navigate(`/my-id?user=${touristId}`);
    onOpenChange(false);
  };

  if (!editedFence) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[420px] sm:max-w-[420px] p-0">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Geofence Settings
            </SheetTitle>
            <SheetDescription>
              Configure fence behavior and notifications.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)] px-6">
            <div className="space-y-6 pb-6">
              {/* Fence Info Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  Fence Info
                </div>

                <div>
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    value={editedFence.name}
                    onChange={(e) => updateFence({ name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="editDesc">Description</Label>
                  <Input
                    id="editDesc"
                    value={editedFence.description}
                    onChange={(e) => updateFence({ description: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fence Type</Label>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {editedFence.fenceType || "Polygon"}
                    </p>
                  </div>
                  <div>
                    <Label>Fence ID</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {editedFence.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCopyId}
                        aria-label="Copy fence ID"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Boundary Details Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPin className="w-4 h-4 text-accent" />
                    Boundary Details
                  </div>
                  <Button variant="outline" size="sm">
                    Edit on Map
                  </Button>
                </div>

                {editedFence.fenceType === "circle" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Center Lat</Label>
                        <Input
                          value={editedFence.center.lat}
                          readOnly
                          className="mt-1 bg-muted/50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Center Lng</Label>
                        <Input
                          value={editedFence.center.lng}
                          readOnly
                          className="mt-1 bg-muted/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Radius (meters)</Label>
                      <Input
                        value={editedFence.radius || 500}
                        onChange={(e) => updateFence({ radius: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-xs">Vertices ({editedFence.vertices.length})</Label>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {editedFence.vertices.map((v, i) => (
                        <p key={i} className="text-xs text-muted-foreground font-mono">
                          Point {i + 1}: {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <Separator />

              {/* Schedule Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock className="w-4 h-4 text-warning" />
                    Schedule
                  </div>
                  <Switch
                    checked={editedFence.scheduled}
                    onCheckedChange={(v) => updateFence({ scheduled: v })}
                    aria-label="Toggle scheduled activation"
                  />
                </div>

                {editedFence.scheduled ? (
                  <div className="space-y-3 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={editedFence.scheduleStart || ""}
                          onChange={(e) => updateFence({ scheduleStart: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={editedFence.scheduleEnd || ""}
                          onChange={(e) => updateFence({ scheduleEnd: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Days of Week</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {DAYS.map((day) => (
                          <button
                            key={day}
                            className={cn(
                              "px-2 py-1 text-xs rounded border transition-colors",
                              editedFence.scheduleDays?.includes(day)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:border-primary"
                            )}
                            onClick={() => {
                              const current = editedFence.scheduleDays || [];
                              const newDays = current.includes(day)
                                ? current.filter((d) => d !== day)
                                : [...current, day];
                              updateFence({ scheduleDays: newDays });
                            }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pl-6">Always Active</p>
                )}
              </section>

              <Separator />

              {/* Alert Rules Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Bell className="w-4 h-4 text-destructive" />
                  Alert Rules
                </div>

                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoNotify" className="text-sm">Auto-Notify</Label>
                    <Switch
                      id="autoNotify"
                      checked={editedFence.autoNotify}
                      onCheckedChange={(v) => updateFence({ autoNotify: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Notify when:</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="notifyEntry"
                        checked={editedFence.notifyOnEntry}
                        onCheckedChange={(v) => updateFence({ notifyOnEntry: !!v })}
                      />
                      <Label htmlFor="notifyEntry" className="text-sm mb-0">Tourist enters</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="notifyExit"
                        checked={editedFence.notifyOnExit}
                        onCheckedChange={(v) => updateFence({ notifyOnExit: !!v })}
                      />
                      <Label htmlFor="notifyExit" className="text-sm mb-0">Tourist exits</Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Severity</Label>
                    <Select
                      value={editedFence.severity}
                      onValueChange={(v: "low" | "medium" | "high") => updateFence({ severity: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Contacts</Label>
                    <div className="mt-1 space-y-1">
                      {editedFence.contacts.length > 0 ? (
                        editedFence.contacts.map((contact, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {contact}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No contacts configured</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Linked Tourists Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="w-4 h-4 text-accent" />
                  Linked Tourists
                </div>

                <div className="space-y-2 pl-6">
                  {mockTourists.map((tourist) => (
                    <div
                      key={tourist.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">{tourist.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7"
                        onClick={() => handleViewTourist(tourist.id)}
                      >
                        View ID
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleViewHistory}>
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Geofence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{editedFence.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(editedFence.id);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

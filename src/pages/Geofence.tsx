import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import {
  GeofenceMap,
  GeofenceList,
  CreateGeofenceWizard,
  FenceSettingsDrawer,
  FenceHistoryModal,
} from "@/components/geofence";
import { useToast } from "@/hooks/use-toast";
import geofencesData from "@/data/geofences.json";

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
  status?: "active" | "inactive" | "breached" | "scheduled";
}

interface NewGeofence {
  name: string;
  description: string;
  type: string;
  fenceType: "circle" | "polygon";
  lat: string;
  lng: string;
  radius?: string;
  scheduled: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  scheduleDays: string[];
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  notifyBreach: boolean;
  notifyTargets: string[];
  severity: "low" | "medium" | "high";
  linkedTourists: string[];
}

export default function Geofence() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [geofences, setGeofences] = useState<Geofence[]>(
    geofencesData.map((f) => ({ ...f, fenceType: "polygon" as const })) as Geofence[]
  );
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFenceId, setHistoryFenceId] = useState<string | null>(null);
  const [breachedFenceId, setBreachedFenceId] = useState<string | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);

  // Handle route-based modals
  useEffect(() => {
    if (location.pathname === "/geofence/create") {
      setShowCreateWizard(true);
    }
    
    const historyMatch = location.pathname.match(/\/geofence\/history\/(.+)/);
    if (historyMatch) {
      setHistoryFenceId(historyMatch[1]);
      setShowHistoryModal(true);
    }

    const editMatch = location.pathname.match(/\/geofence\/edit\/(.+)/);
    if (editMatch) {
      const fence = geofences.find((f) => f.id === editMatch[1]);
      if (fence) {
        setSelectedFenceId(fence.id);
        setShowSettingsDrawer(true);
      }
    }
  }, [location.pathname, geofences]);

  // Breach simulation (demo)
  useEffect(() => {
    const simulateBreach = () => {
      // Random chance to trigger breach on restricted zone
      const restrictedFences = geofences.filter(
        (f) => f.type === "restricted_zone" && f.enabled
      );
      if (restrictedFences.length > 0 && Math.random() > 0.7) {
        const fence = restrictedFences[Math.floor(Math.random() * restrictedFences.length)];
        setBreachedFenceId(fence.id);
        
        toast({
          title: "🚨 Fence Breach Detected",
          description: `Alert: Unauthorized entry at ${fence.name}`,
          variant: "destructive",
        });

        // Clear breach after 5 seconds
        setTimeout(() => setBreachedFenceId(null), 5000);
      }
    };

    // Simulate breach every 30 seconds (for demo)
    const interval = setInterval(simulateBreach, 30000);
    return () => clearInterval(interval);
  }, [geofences, toast]);

  const selectedFence = geofences.find((f) => f.id === selectedFenceId) || null;

  const handleSelectFence = useCallback((fence: Geofence) => {
    setSelectedFenceId(fence.id);
    // Announce selection for screen readers
    const announcement = document.getElementById("fence-announcement");
    if (announcement) {
      announcement.textContent = `Selected ${fence.name}`;
    }
  }, []);

  const handleToggleFence = useCallback((id: string) => {
    setGeofences((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
    const fence = geofences.find((f) => f.id === id);
    toast({
      title: "Geofence Updated",
      description: `${fence?.name} has been ${fence?.enabled ? "disabled" : "enabled"}.`,
    });
  }, [geofences, toast]);

  const handleOpenCreate = useCallback(() => {
    navigate("/geofence/create");
  }, [navigate]);

  const handleCloseCreate = useCallback((open: boolean) => {
    if (!open) {
      navigate("/geofence");
    }
    setShowCreateWizard(open);
  }, [navigate]);

  const handleCreateFence = useCallback((newFenceData: NewGeofence) => {
    const lat = parseFloat(newFenceData.lat);
    const lng = parseFloat(newFenceData.lng);
    const radius = newFenceData.radius ? parseFloat(newFenceData.radius) : 500;

    // Generate vertices for polygon or use center for circle
    const vertices: Vertex[] = newFenceData.fenceType === "circle"
      ? [
          { lat: lat + 0.01, lng: lng - 0.01 },
          { lat: lat + 0.01, lng: lng + 0.01 },
          { lat: lat - 0.01, lng: lng + 0.01 },
          { lat: lat - 0.01, lng: lng - 0.01 },
        ]
      : [
          { lat: lat + 0.015, lng: lng - 0.01 },
          { lat: lat + 0.01, lng: lng + 0.015 },
          { lat: lat - 0.01, lng: lng + 0.01 },
          { lat: lat - 0.015, lng: lng - 0.005 },
        ];

    const newGeofence: Geofence = {
      id: `geo_${Date.now()}`,
      name: newFenceData.name,
      description: newFenceData.description,
      type: newFenceData.type,
      enabled: true,
      color: newFenceData.type === "restricted_zone" ? "#E25B4A" : "#0B6E4F",
      vertices,
      center: { lat, lng },
      autoNotify: true,
      notifyOnEntry: newFenceData.notifyOnEntry,
      notifyOnExit: newFenceData.notifyOnExit,
      contacts: [],
      activeIncidents: 0,
      totalTourists: 0,
      fenceType: newFenceData.fenceType,
      radius,
      scheduled: newFenceData.scheduled,
      scheduleStart: newFenceData.scheduleStart,
      scheduleEnd: newFenceData.scheduleEnd,
      scheduleDays: newFenceData.scheduleDays,
      severity: newFenceData.severity,
      status: newFenceData.scheduled ? "scheduled" : "active",
    };

    setGeofences((prev) => [...prev, newGeofence]);
    navigate("/geofence");
    
    toast({
      title: "✅ Geo-Fence Activated",
      description: `${newFenceData.name} has been created and is now active.`,
    });

    // Screen reader announcement
    const announcement = document.getElementById("fence-announcement");
    if (announcement) {
      announcement.textContent = `Fence created: ${newFenceData.name}`;
    }
  }, [navigate, toast]);

  const handleOpenSettings = useCallback((fence: Geofence) => {
    setSelectedFenceId(fence.id);
    setShowSettingsDrawer(true);
    navigate(`/geofence/edit/${fence.id}`);
  }, [navigate]);

  const handleCloseSettings = useCallback((open: boolean) => {
    if (!open) {
      navigate("/geofence");
    }
    setShowSettingsDrawer(open);
  }, [navigate]);

  const handleSaveSettings = useCallback((updatedFence: Geofence) => {
    setGeofences((prev) =>
      prev.map((f) => (f.id === updatedFence.id ? updatedFence : f))
    );
    setShowSettingsDrawer(false);
    navigate("/geofence");
    
    toast({
      title: "Settings Saved",
      description: `${updatedFence.name} settings have been updated.`,
    });

    // Screen reader announcement
    const announcement = document.getElementById("fence-announcement");
    if (announcement) {
      announcement.textContent = `Fence updated: ${updatedFence.name}`;
    }
  }, [navigate, toast]);

  const handleDeleteFence = useCallback((id: string) => {
    const fence = geofences.find((f) => f.id === id);
    setGeofences((prev) => prev.filter((f) => f.id !== id));
    setShowSettingsDrawer(false);
    setSelectedFenceId(null);
    navigate("/geofence");
    
    toast({
      title: "Geofence Deleted",
      description: `${fence?.name} has been removed.`,
    });
  }, [geofences, navigate, toast]);

  const handleOpenHistory = useCallback((fenceId: string) => {
    setHistoryFenceId(fenceId);
    setShowHistoryModal(true);
    navigate(`/geofence/history/${fenceId}`);
  }, [navigate]);

  const handleCloseHistory = useCallback((open: boolean) => {
    if (!open) {
      navigate("/geofence");
    }
    setShowHistoryModal(open);
    setHistoryFenceId(null);
  }, [navigate]);

  const handleStartDraw = useCallback((type: "circle" | "polygon") => {
    setIsDrawMode(true);
    toast({
      title: "Draw Mode Active",
      description: `Click on the map to draw a ${type} fence. Press Escape to cancel.`,
    });
  }, [toast]);

  // Cancel draw mode on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawMode) {
        setIsDrawMode(false);
        toast({
          title: "Draw Mode Cancelled",
          description: "Fence drawing has been cancelled.",
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawMode, toast]);

  const historyFence = geofences.find((f) => f.id === historyFenceId);

  return (
    <MainLayout>
      {/* Screen Reader Announcements */}
      <div
        id="fence-announcement"
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      <div className="container-main py-8 lg:py-12" style={{ marginTop: "24px" }}>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Geofence Management</h1>
          <p className="text-muted-foreground mt-1">
            Define, monitor, and manage safety boundaries for tourist zones
          </p>
        </div>

        {/* Main Layout: 70% Map / 30% Controls */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Map Section - 70% */}
          <div className="flex-1 lg:w-[70%]">
            <GeofenceMap
              geofences={geofences}
              selectedFenceId={selectedFenceId}
              onSelectFence={handleSelectFence}
              onStartDraw={handleStartDraw}
              isDrawMode={isDrawMode}
              breachedFenceId={breachedFenceId}
              className="h-[500px] lg:h-[600px]"
            />
          </div>

          {/* Control Panel - 30% */}
          <div className="w-full lg:w-[30%] lg:min-w-[300px] lg:max-w-[360px]">
            <GeofenceList
              geofences={geofences}
              selectedFenceId={selectedFenceId}
              onSelectFence={handleSelectFence}
              onToggleFence={handleToggleFence}
              onCreateNew={handleOpenCreate}
              onOpenSettings={handleOpenSettings}
            />
          </div>
        </div>
      </div>

      {/* Create Geofence Wizard */}
      <CreateGeofenceWizard
        open={showCreateWizard}
        onOpenChange={handleCloseCreate}
        onComplete={handleCreateFence}
      />

      {/* Settings Drawer */}
      <FenceSettingsDrawer
        fence={selectedFence}
        open={showSettingsDrawer}
        onOpenChange={handleCloseSettings}
        onSave={handleSaveSettings}
        onDelete={handleDeleteFence}
      />

      {/* History Modal */}
      <FenceHistoryModal
        fenceId={historyFenceId}
        fenceName={historyFence?.name || ""}
        open={showHistoryModal}
        onOpenChange={handleCloseHistory}
      />
    </MainLayout>
  );
}

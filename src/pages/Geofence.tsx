import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { MapboxMap } from "@/components/map/MapboxMap";
import { MapTourist, MapGeofence } from "@/components/map/types";
import {
  GeofenceList,
  CreateGeofenceWizard,
  FenceSettingsDrawer,
  FenceHistoryModal,
} from "@/components/geofence";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import geofencesData from "@/data/geofences.json";
import usersData from "@/data/users.json";

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
  const { hasPermission } = useRole();
  
  const [geofences, setGeofences] = useState<Geofence[]>(
    geofencesData.map((f) => ({ ...f, fenceType: "polygon" as const })) as Geofence[]
  );
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFenceId, setHistoryFenceId] = useState<string | null>(null);
  const [breachedFenceId, setBreachedFenceId] = useState<string | null>(null);

  // Convert users data to MapTourist format
  const tourists: MapTourist[] = useMemo(() => {
    return usersData.map((user) => ({
      id: user.id,
      name: user.name,
      lat: user.location.lat,
      lng: user.location.lng,
      status: user.status as "verified" | "pending" | "alert" | "inactive",
      riskScore: Math.floor(Math.random() * 100),
      lastUpdated: user.lastCheckIn,
      photo: user.photo,
      country: user.country,
    }));
  }, []);

  // Convert geofences to MapGeofence format for the map
  const mapGeofences: MapGeofence[] = useMemo(() => {
    return geofences.map((fence) => ({
      id: fence.id,
      name: fence.name,
      description: fence.description,
      type: fence.fenceType || "polygon",
      severity: fence.severity || "medium",
      status: fence.enabled 
        ? (breachedFenceId === fence.id ? "breached" : "active") 
        : "inactive",
      coordinates: fence.vertices.map(v => [v.lng, v.lat] as [number, number]),
      center: [fence.center.lng, fence.center.lat] as [number, number],
      radius: fence.radius,
      color: fence.color,
      enabled: fence.enabled,
      fenceType: fence.type,
    }));
  }, [geofences, breachedFenceId]);

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
      const restrictedFences = geofences.filter(
        (f) => f.type === "restricted_zone" && f.enabled
      );
      if (restrictedFences.length > 0 && Math.random() > 0.7) {
        const fence = restrictedFences[Math.floor(Math.random() * restrictedFences.length)];
        setBreachedFenceId(fence.id);
        
        toast({
          title: "Fence Breach Detected",
          description: `Alert: Unauthorized entry at ${fence.name}`,
          variant: "destructive",
        });

        setTimeout(() => setBreachedFenceId(null), 5000);
      }
    };

    const interval = setInterval(simulateBreach, 30000);
    return () => clearInterval(interval);
  }, [geofences, toast]);

  const selectedFence = geofences.find((f) => f.id === selectedFenceId) || null;

  const handleSelectFence = useCallback((fence: Geofence) => {
    setSelectedFenceId(fence.id);
  }, []);

  const handleSelectMapFence = useCallback((fence: MapGeofence) => {
    setSelectedFenceId(fence.id);
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
      title: "Geo-Fence Created",
      description: `${newFenceData.name} has been created and is now active.`,
    });
  }, [navigate, toast]);

  const handleCreateMapFence = useCallback((fenceData: Partial<MapGeofence>) => {
    if (!hasPermission("canManageGeofence")) return;

    const newGeofence: Geofence = {
      id: `geo_${Date.now()}`,
      name: `New Fence ${Date.now()}`,
      description: "Created via map drawing",
      type: fenceData.severity === "high" ? "restricted_zone" : "monitored_zone",
      enabled: true,
      color: fenceData.severity === "high" ? "#E25B4A" : "#00A3B4",
      vertices: fenceData.coordinates 
        ? fenceData.coordinates.map(c => ({ lat: c[1], lng: c[0] }))
        : [],
      center: fenceData.center 
        ? { lat: fenceData.center[1], lng: fenceData.center[0] }
        : { lat: 13.7563, lng: 100.5018 },
      autoNotify: true,
      notifyOnEntry: true,
      notifyOnExit: true,
      contacts: [],
      activeIncidents: 0,
      totalTourists: 0,
      fenceType: fenceData.type === "circle" ? "circle" : "polygon",
      radius: fenceData.radius,
      severity: fenceData.severity || "medium",
      status: "active",
    };

    setGeofences((prev) => [...prev, newGeofence]);
    setSelectedFenceId(newGeofence.id);
    setShowSettingsDrawer(true);

    toast({
      title: "Fence Created",
      description: "Edit the fence details in the settings panel.",
    });
  }, [hasPermission, toast]);

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
            Real-world GPS-accurate boundaries with drawing tools for authority roles
          </p>
        </div>

        {/* Main Layout: 70% Map / 30% Controls */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Real-World Map Section - 70% */}
          <div className="flex-1 lg:w-[70%]">
            <MapboxMap
              tourists={tourists}
              geofences={mapGeofences}
              selectedFenceId={selectedFenceId}
              breachedFenceId={breachedFenceId}
              onSelectFence={handleSelectMapFence}
              onCreateFence={handleCreateMapFence}
              onDeleteFence={handleDeleteFence}
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

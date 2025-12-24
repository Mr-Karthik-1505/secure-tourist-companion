import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  MapPin,
  Users,
  Shield,
  Radio,
  Eye,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize2,
  Activity,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import geofencesData from '@/data/geofences.json';
import usersData from '@/data/users.json';
import incidentsData from '@/data/incidents.json';
import { simulateBreach, onAlert, onIncident, type Alert, type Incident } from '@/services/events/geofenceEngine';

interface TouristMarker {
  id: string;
  name: string;
  status: string;
  location: { lat: number; lng: number };
  riskScore: number;
}

export default function ControlRoom() {
  const { hasPermission } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Transform user data to tourist markers with risk scores
  const tourists: TouristMarker[] = (usersData as any[]).map(user => ({
    id: user.id,
    name: user.name,
    status: user.status,
    location: user.location,
    riskScore: user.status === 'alert' ? 85 : user.status === 'pending' ? 45 : 15,
  }));

  const highRiskTourists = tourists.filter(t => t.riskScore > 50);
  const activeIncidents = (incidentsData as any[]).filter(i => i.status !== 'resolved');
  const geofences = geofencesData as any[];

  // Subscribe to live events
  useEffect(() => {
    const unsubAlert = onAlert((alert) => {
      setLiveAlerts(prev => [alert, ...prev].slice(0, 20));
      if (audioEnabled) {
        // Play alert sound (mock)
        console.log('[AUDIO] Alert sound played');
      }
      toast({
        title: alert.title,
        description: alert.message,
        variant: alert.priority === 'critical' ? 'destructive' : 'default',
      });
    });

    const unsubIncident = onIncident((incident) => {
      setLiveIncidents(prev => [incident, ...prev].slice(0, 10));
    });

    return () => {
      unsubAlert();
      unsubIncident();
    };
  }, [audioEnabled, toast]);

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleSimulateBreach = useCallback(() => {
    const randomUser = tourists[Math.floor(Math.random() * tourists.length)];
    const restrictedZone = geofences.find(g => g.type === 'restricted_zone');
    
    if (randomUser && restrictedZone) {
      const result = simulateBreach(randomUser.id, restrictedZone.id);
      console.log('[SIMULATION] Breach result:', result);
    }
  }, [tourists, geofences]);

  const handleManualOverride = (geofenceId: string, action: 'lockdown' | 'release') => {
    toast({
      title: `Manual Override: ${action.toUpperCase()}`,
      description: `Zone ${geofenceId} has been ${action === 'lockdown' ? 'locked down' : 'released'}.`,
    });
  };

  // Check permissions - must be after all hooks
  if (!hasPermission('canAccessControlRoom')) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Control Room access is limited to Authority and Admin roles only.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Radio className="w-6 h-6 text-primary animate-pulse" />
              Control Room
            </h1>
            <p className="text-muted-foreground">
              Live monitoring dashboard • Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Audio</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAudioEnabled(!audioEnabled)}
                aria-label={audioEnabled ? 'Disable audio alerts' : 'Enable audio alerts'}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto-refresh</span>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                aria-label="Toggle auto-refresh"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLastUpdate(new Date())}
              aria-label="Refresh data"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSimulateBreach}
              aria-label="Simulate breach event"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Simulate Breach
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tourists</p>
                <p className="text-2xl font-bold">{tourists.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Incidents</p>
                <p className="text-2xl font-bold">{activeIncidents.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold">{highRiskTourists.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Zones</p>
                <p className="text-2xl font-bold">{geofences.filter(g => g.enabled).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Map Area */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Map Overview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Filter zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {geofences.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" aria-label="Fullscreen map">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mock Map Visualization */}
              <div 
                className="relative w-full h-[400px] bg-muted/30 rounded-lg overflow-hidden border"
                role="img"
                aria-label="Live tourist and geofence map"
              >
                {/* Grid background */}
                <svg className="absolute inset-0 w-full h-full opacity-20">
                  <defs>
                    <pattern id="control-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#control-grid)" />
                </svg>
                
                {/* Geofence zones */}
                {geofences.map((fence, index) => {
                  const x = 50 + (index % 3) * 150;
                  const y = 80 + Math.floor(index / 3) * 140;
                  const isRestricted = fence.type === 'restricted_zone';
                  
                  return (
                    <div
                      key={fence.id}
                      className={`absolute w-32 h-24 rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-105 ${
                        isRestricted 
                          ? 'border-destructive bg-destructive/10' 
                          : 'border-primary bg-primary/10'
                      }`}
                      style={{ left: x, top: y }}
                      onClick={() => navigate(`/geofence?zone=${fence.id}`)}
                      role="button"
                      aria-label={`View ${fence.name} zone`}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/geofence?zone=${fence.id}`)}
                    >
                      <span className="text-xs font-medium text-center px-2">{fence.name}</span>
                      <Badge 
                        variant={isRestricted ? 'destructive' : 'default'} 
                        className="mt-1 text-[10px]"
                      >
                        {fence.totalTourists} tourists
                      </Badge>
                      {fence.activeIncidents > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center animate-pulse">
                          {fence.activeIncidents}
                        </span>
                      )}
                    </div>
                  );
                })}
                
                {/* Tourist markers */}
                {tourists.map((tourist, index) => {
                  const x = 80 + (index * 90) % 450;
                  const y = 60 + (index * 60) % 300;
                  
                  return (
                    <div
                      key={tourist.id}
                      className={`absolute w-4 h-4 rounded-full border-2 border-background shadow-lg transition-all hover:scale-150 cursor-pointer ${
                        tourist.riskScore > 70 ? 'bg-destructive animate-pulse' :
                        tourist.riskScore > 40 ? 'bg-warning' : 'bg-primary'
                      }`}
                      style={{ left: x, top: y }}
                      onClick={() => navigate(`/my-id?user=${tourist.id}`)}
                      role="button"
                      aria-label={`Tourist: ${tourist.name}, Risk: ${tourist.riskScore}`}
                      tabIndex={0}
                    />
                  );
                })}

                {/* Map legend */}
                <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span>Safe Tourist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning" />
                    <span>Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-destructive" />
                    <span>High Risk</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* High Risk Tourists */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  High-Risk Tourists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[140px]">
                  {highRiskTourists.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No high-risk tourists detected
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {highRiskTourists.map(tourist => (
                        <div
                          key={tourist.id}
                          className="flex items-center justify-between p-2 bg-destructive/5 rounded-lg cursor-pointer hover:bg-destructive/10 transition-colors"
                          onClick={() => navigate(`/my-id?user=${tourist.id}`)}
                          role="button"
                          tabIndex={0}
                        >
                          <div>
                            <p className="text-sm font-medium">{tourist.name}</p>
                            <p className="text-xs text-muted-foreground">{tourist.status}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            Risk: {tourist.riskScore}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Active Incidents */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Active Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[180px]">
                  <div className="space-y-2">
                    {activeIncidents.map((incident: any) => (
                      <div
                        key={incident.id}
                        className="p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/alerts/${incident.id}`)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium line-clamp-1">{incident.title}</p>
                          <Badge 
                            variant={incident.severity === 'high' ? 'destructive' : 'secondary'}
                            className="text-[10px] ml-2"
                          >
                            {incident.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(incident.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {incident.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Geofence Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  Zone Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {geofences.slice(0, 4).map((fence: any) => (
                      <div key={fence.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: fence.color }}
                          />
                          <span className="text-xs font-medium">{fence.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleManualOverride(fence.id, 'lockdown')}
                          >
                            Lockdown
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => handleManualOverride(fence.id, 'release')}
                          >
                            Release
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

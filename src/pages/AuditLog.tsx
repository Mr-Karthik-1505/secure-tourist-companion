import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Search,
  Filter,
  Download,
  Shield,
  MapPin,
  User,
  AlertTriangle,
  Settings,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import auditData from '@/data/audit.json';

type AuditCategory = 'all' | 'incident' | 'geofence' | 'kyc' | 'identity' | 'system';
type ActorType = 'all' | 'system' | 'tourist' | 'verifier' | 'authority' | 'admin';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  actor: {
    id: string;
    type: string;
    name: string;
  };
  target: {
    id: string;
    type: string;
    name: string;
  };
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  incident: AlertTriangle,
  geofence: MapPin,
  kyc: Shield,
  identity: User,
  system: Settings,
};

const categoryColors: Record<string, string> = {
  incident: 'bg-destructive/10 text-destructive border-destructive/20',
  geofence: 'bg-accent/10 text-accent border-accent/20',
  kyc: 'bg-primary/10 text-primary border-primary/20',
  identity: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  system: 'bg-muted text-muted-foreground border-border',
};

export default function AuditLog() {
  const { hasPermission } = useRole();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory>('all');
  const [actorFilter, setActorFilter] = useState<ActorType>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  
  const auditEntries = auditData as AuditEntry[];

  // Filter entries
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          entry.action.toLowerCase().includes(query) ||
          entry.actor.name.toLowerCase().includes(query) ||
          entry.target.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
        return false;
      }
      
      // Actor filter
      if (actorFilter !== 'all' && entry.actor.type !== actorFilter) {
        return false;
      }
      
      return true;
    });
  }, [auditEntries, searchQuery, categoryFilter, actorFilter]);


  // Check permissions - must be after all hooks
  if (!hasPermission('canViewAuditLogs')) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Audit Log access is limited to Admin roles only.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const formatAction = (action: string): string => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string): { date: string; time: string } => {
    const dt = new Date(timestamp);
    return {
      date: dt.toLocaleDateString(),
      time: dt.toLocaleTimeString(),
    };
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Category', 'Actor', 'Target', 'IP Address'].join(','),
      ...filteredEntries.map(e => [
        e.timestamp,
        e.action,
        e.category,
        e.actor.name,
        e.target.name,
        e.ipAddress,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground">
              Immutable record of all system actions • {filteredEntries.length} entries
            </p>
          </div>
          
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, actors, or targets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search audit logs"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as AuditCategory)}>
                  <SelectTrigger className="w-[140px]" aria-label="Filter by category">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="incident">Incidents</SelectItem>
                    <SelectItem value="geofence">Geofence</SelectItem>
                    <SelectItem value="kyc">KYC</SelectItem>
                    <SelectItem value="identity">Identity</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={actorFilter} onValueChange={(v) => setActorFilter(v as ActorType)}>
                  <SelectTrigger className="w-[140px]" aria-label="Filter by actor type">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Actor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actors</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="tourist">Tourist</SelectItem>
                    <SelectItem value="verifier">Verifier</SelectItem>
                    <SelectItem value="authority">Authority</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Event Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {filteredEntries.map((entry, index) => {
                  const Icon = categoryIcons[entry.category] || FileText;
                  const colorClass = categoryColors[entry.category] || categoryColors.system;
                  const { date, time } = formatTimestamp(entry.timestamp);
                  
                  return (
                    <Dialog key={entry.id}>
                      <DialogTrigger asChild>
                        <div
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                          role="button"
                          tabIndex={0}
                          aria-label={`View details for ${entry.action}`}
                          onClick={() => setSelectedEntry(entry)}
                        >
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`p-2 rounded-lg border ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {index < filteredEntries.length - 1 && (
                              <div className="w-px h-full min-h-[40px] bg-border mt-2" />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {formatAction(entry.action)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  <span className="font-medium">{entry.actor.name}</span>
                                  {' → '}
                                  <span>{entry.target.name}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">{date}</p>
                                  <p className="text-xs text-muted-foreground">{time}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px]">
                                {entry.category}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {entry.actor.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            {formatAction(entry.action)}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                              <p className="text-sm font-medium">
                                {new Date(entry.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Category</p>
                              <Badge className={colorClass}>{entry.category}</Badge>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Actor</p>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="font-medium text-sm">{entry.actor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Type: {entry.actor.type} • ID: {entry.actor.id}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Target</p>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="font-medium text-sm">{entry.target.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Type: {entry.target.type} • ID: {entry.target.id}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Details</p>
                            <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-auto max-h-[150px]">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>IP: {entry.ipAddress}</span>
                            <span className="truncate max-w-[200px]">{entry.userAgent}</span>
                          </div>
                          
                          {/* Navigation to related entities */}
                          {entry.target.type === 'incident' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => navigate(`/alerts/${entry.target.id}`)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Incident
                            </Button>
                          )}
                          {entry.target.type === 'geofence' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => navigate(`/geofence?zone=${entry.target.id}`)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Geofence
                            </Button>
                          )}
                          {entry.target.type === 'user' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => navigate(`/my-id?user=${entry.target.id}`)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View User
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
                
                {filteredEntries.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No audit entries match your filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

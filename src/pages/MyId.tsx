import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Shield,
  Share2,
  Eye,
  XCircle,
  Copy,
  Check,
  QrCode,
  MapPin,
  Phone,
  Calendar,
  Building,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import usersData from "@/data/users.json";

const activityLog = [
  { id: 1, action: "ID Created", timestamp: "2024-01-15T10:30:00Z", details: "Digital ID minted on blockchain" },
  { id: 2, action: "KYC Verified", timestamp: "2024-01-15T11:00:00Z", details: "Documents verified by authority" },
  { id: 3, action: "Check-in", timestamp: "2024-12-10T14:30:00Z", details: "Location: Grand Palace Area" },
  { id: 4, action: "Geofence Entry", timestamp: "2024-12-10T09:00:00Z", details: "Entered Bangkok Old City zone" },
  { id: 5, action: "Emergency Contact Updated", timestamp: "2024-12-05T16:20:00Z", details: "Contact info modified" },
];

export default function MyId() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user") || "usr_001";
  const { toast } = useToast();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Get user data
  const user = usersData.find((u) => u.id === userId) || usersData[0];

  const statusColors = {
    verified: "bg-success text-success-foreground",
    pending: "bg-warning text-warning-foreground",
    alert: "bg-destructive text-destructive-foreground",
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Mock encrypted share URL — using crypto.randomUUID for unpredictable tokens
  const shareUrl = `https://tourist-safety.io/verify/${user.id}?token=enc_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Digital ID
            </h1>
            <p className="text-muted-foreground">
              Blockchain-verified identity card
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main ID Card */}
            <Card className="lg:col-span-2 overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    <span className="font-semibold">Smart Tourist Safety</span>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      statusColors[user.status as keyof typeof statusColors]
                    )}
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Photo & QR */}
                  <div className="flex sm:flex-col items-center gap-4">
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-24 h-24 rounded-xl object-cover border-4 border-border"
                    />
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                      <p className="text-muted-foreground">{user.country}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Passport</p>
                          <p className="font-medium text-foreground">{user.passport}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Valid Until</p>
                          <p className="font-medium text-foreground">{formatDate(user.validUntil)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Destination</p>
                          <p className="font-medium text-foreground">{user.tripDetails.destination}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Accommodation</p>
                          <p className="font-medium text-foreground truncate">{user.tripDetails.accommodation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Emergency Contact</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{user.emergencyContact.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({user.emergencyContact.relation})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share (Encrypted Link)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowProofModal(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Show Proof
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    disabled
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Revoke ID (Admin Only)
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-2">Trip Dates</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arrival:</span>
                    <span className="text-foreground">{formatDate(user.tripDetails.arrivalDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure:</span>
                    <span className="text-foreground">{formatDate(user.tripDetails.departureDate)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Activity Log */}
          <Card className="mt-8 p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Activity Log</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[100px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLog.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{formatTime(log.timestamp)}</TableCell>
                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowActivityModal(log.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Encrypted Link
            </DialogTitle>
            <DialogDescription>
              Generate a secure, time-limited link to share your ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <code className="text-sm text-foreground truncate flex-1">{shareUrl}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(shareUrl)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link expires in 24 hours and can only be viewed once.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Zero-Knowledge Proof
            </DialogTitle>
            <DialogDescription>
              Verify identity without revealing personal data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-medium text-foreground mb-3">Proof Statement</h4>
              <p className="text-sm text-muted-foreground mb-4">
                "I am a verified tourist with a valid ID, over 18 years old, from an approved country."
              </p>
              <div className="flex items-center gap-2 text-success">
                <Check className="w-5 h-5" />
                <span className="font-medium">Proof Valid</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Proof Type:</span>
                <span className="text-foreground">zk-SNARK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Circuit:</span>
                <span className="text-foreground">identity_v2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verification Time:</span>
                <span className="text-foreground">12ms</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Detail Modal */}
      <Dialog open={showActivityModal !== null} onOpenChange={() => setShowActivityModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {showActivityModal && (
            <div className="space-y-4">
              {(() => {
                const log = activityLog.find((l) => l.id === showActivityModal);
                if (!log) return null;
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Action:</span>
                        <span className="font-medium text-foreground">{log.action}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="text-foreground">{formatTime(log.timestamp)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Details:</span>
                        <span className="text-foreground">{log.details}</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        TX Hash: 0x{Math.random().toString(16).slice(2, 18)}...
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

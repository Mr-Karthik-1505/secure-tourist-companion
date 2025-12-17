import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield,
  Search,
  Plus,
  Copy,
  Download,
  Eye,
  XCircle,
  Check,
  Lock,
  FileText,
  User,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useKYC } from "@/hooks/useKYC";
import usersData from "@/data/users.json";

interface KYCUser {
  id: string;
  address: string;
  name: string;
  passport: string;
  country: string;
  status: string;
  photo: string;
  kycCID: string;
  dataHash: string;
  validFrom: string;
  validUntil: string;
}

export default function KYCDashboard() {
  const { toast } = useToast();
  const { loading: apiLoading, upload, revoke } = useKYC();
  const [users] = useState<KYCUser[]>(usersData as KYCUser[]);
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifierMode, setVerifierMode] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [newKYC, setNewKYC] = useState({
    address: "",
    encrypt: true,
    file: null as File | null,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    verified: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    alert: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Hash copied to clipboard",
    });
  };

  const handleRevoke = async () => {
    if (!selectedUser) return;
    
    // Try API first, fall back to mock if backend unavailable
    const result = await revoke(selectedUser.address, "Manual revocation");
    
    if (result) {
      setShowRevokeModal(false);
      setSelectedUser(null);
    } else {
      // Mock fallback for demo
      toast({
        title: "KYC Revoked (Mock)",
        description: `${selectedUser.name}'s KYC has been revoked locally.`,
      });
      setShowRevokeModal(false);
      setSelectedUser(null);
    }
  };

  const handleAddKYC = async () => {
    if (!newKYC.address.startsWith("0x") || newKYC.address.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address.",
        variant: "destructive",
      });
      return;
    }

    if (!newKYC.file) {
      toast({
        title: "No File",
        description: "Please upload a KYC document.",
        variant: "destructive",
      });
      return;
    }

    // Try API first, fall back to mock if backend unavailable
    const result = await upload(
      newKYC.address,
      newKYC.file,
      newKYC.encrypt ? "client" : "server"
    );

    if (result) {
      setShowAddModal(false);
      setNewKYC({ address: "", encrypt: true, file: null });
    } else {
      // Mock fallback for demo
      toast({
        title: "KYC Added (Mock)",
        description: "New KYC entry has been created locally.",
      });
      setShowAddModal(false);
      setNewKYC({ address: "", encrypt: true, file: null });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">KYC Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage and verify tourist identities
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="verifierMode" className="text-sm">
                Verifier Mode
              </Label>
              <Switch
                id="verifierMode"
                checked={verifierMode}
                onCheckedChange={setVerifierMode}
              />
            </div>
            {verifierMode && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add KYC
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* User List */}
          <div className="w-full lg:w-80">
            <Card className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all",
                      "hover:bg-muted/50 focus-ring",
                      selectedUser?.id === user.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photo}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.address.slice(0, 8)}...{user.address.slice(-6)}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          user.status === "verified" && "bg-success",
                          user.status === "pending" && "bg-warning",
                          user.status === "alert" && "bg-destructive"
                        )}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* User Details */}
          <div className="flex-1">
            {selectedUser ? (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedUser.photo}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-border"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {selectedUser.name}
                      </h2>
                      <p className="text-muted-foreground">{selectedUser.country}</p>
                      <Badge
                        variant="outline"
                        className={cn("mt-2", statusColors[selectedUser.status])}
                      >
                        {selectedUser.status.charAt(0).toUpperCase() +
                          selectedUser.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* KYC Data */}
                  <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      KYC Data
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">IPFS CID</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-sm bg-background rounded px-2 py-1 truncate">
                            {selectedUser.kycCID}
                          </code>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => handleCopy(selectedUser.kycCID)}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="iconSm" asChild>
                            <a
                              href={`https://ipfs.io/ipfs/${selectedUser.kycCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open in IPFS"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Data Hash</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 text-sm bg-background rounded px-2 py-1 truncate">
                            {selectedUser.dataHash}
                          </code>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => handleCopy(selectedUser.dataHash)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Valid From</Label>
                          <p className="text-sm font-medium text-foreground mt-1">
                            {formatDate(selectedUser.validFrom)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Valid Until</Label>
                          <p className="text-sm font-medium text-foreground mt-1">
                            {formatDate(selectedUser.validUntil)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {verifierMode && (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => setShowRevokeModal(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Encrypted Blob
                      </Button>
                      <Button variant="outline" onClick={() => setShowProofModal(true)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Proofs
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a User
                </h3>
                <p className="text-muted-foreground">
                  Choose a user from the list to view their KYC details.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add KYC Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New KYC
            </DialogTitle>
            <DialogDescription>
              Register a new tourist identity on the blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ethAddress">Ethereum Address *</Label>
              <Input
                id="ethAddress"
                value={newKYC.address}
                onChange={(e) => setNewKYC((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="0x..."
              />
            </div>

            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                newKYC.file ? "border-success bg-success/5" : "border-border hover:border-primary/50"
              )}
            >
              <input
                type="file"
                accept=".pdf,.json"
                onChange={(e) => setNewKYC((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                className="hidden"
                id="kyc-file-upload"
              />
              <label htmlFor="kyc-file-upload" className="cursor-pointer">
                {newKYC.file ? (
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 text-success mx-auto" />
                    <p className="text-sm font-medium text-foreground">{newKYC.file.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Upload KYC documents</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="encryptToggle" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Client-side Encryption
              </Label>
              <Switch
                id="encryptToggle"
                checked={newKYC.encrypt}
                onCheckedChange={(checked) => setNewKYC((prev) => ({ ...prev, encrypt: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={apiLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddKYC} disabled={apiLoading}>
              {apiLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              {apiLoading ? "Uploading..." : "Sign & Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Modal */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Revoke KYC
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The user's KYC status will be invalidated.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
              <p className="text-sm text-foreground">
                You are about to revoke the KYC for:
              </p>
              <p className="font-semibold text-foreground mt-2">{selectedUser?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedUser?.address}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeModal(false)} disabled={apiLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={apiLoading}>
              {apiLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {apiLoading ? "Revoking..." : "Confirm Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Zero-Knowledge Proofs
            </DialogTitle>
            <DialogDescription>
              Verification proofs for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {["Identity Verification", "Age Verification", "Country Verification"].map(
              (proof, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="font-medium text-foreground">{proof}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Valid</span>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

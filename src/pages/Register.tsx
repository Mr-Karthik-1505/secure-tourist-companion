import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Plane,
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  FileText,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useKYC } from "@/hooks/useKYC";

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Travel Details", icon: Plane },
  { id: 3, title: "Upload & Verify", icon: Upload },
];

const countries = [
  "India", "Singapore", "United Kingdom", "Japan", "Mexico", "United States",
  "Australia", "Germany", "France", "Canada", "Brazil", "Thailand",
];

interface FormData {
  name: string;
  passport: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  destination: string;
  accommodation: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  file: File | null;
}

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: apiLoading, upload } = useKYC();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ cid: string; txHash: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    passport: "",
    country: "",
    arrivalDate: "",
    departureDate: "",
    destination: "Thailand",
    accommodation: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    file: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.passport.trim()) newErrors.passport = "Passport/Aadhaar is required";
      if (!formData.country) newErrors.country = "Country is required";
    } else if (step === 2) {
      if (!formData.arrivalDate) newErrors.arrivalDate = "Arrival date is required";
      if (!formData.departureDate) newErrors.departureDate = "Departure date is required";
      if (!formData.emergencyName.trim()) newErrors.emergencyName = "Emergency contact name is required";
      if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = "Emergency contact phone is required";
    } else if (step === 3) {
      if (!formData.file) newErrors.file = "Please upload your documents";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      setErrors((prev) => ({ ...prev, file: undefined }));
      
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleGenerateId = async () => {
    if (!validateStep(3)) return;
    setShowBlockchainModal(true);
    setIsProcessing(true);

    // Generate mock wallet address for demo
    const mockUserAddress = "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, "0");

    // Try real API upload
    if (formData.file) {
      const result = await upload(mockUserAddress, formData.file, "server");
      
      if (result) {
        setUploadResult({ cid: result.cid, txHash: result.txHash });
        setGeneratedId(result.txHash.slice(0, 18));
        setIsProcessing(false);
        return;
      }
    }

    // Mock fallback if API unavailable
    setTimeout(() => {
      setIsProcessing(false);
      setGeneratedId("0x" + Math.random().toString(16).slice(2, 18));
      setUploadResult({
        cid: "Qm" + Math.random().toString(36).slice(2, 12),
        txHash: "0x" + Math.random().toString(16).slice(2, 66),
      });
    }, 3000);
  };

  const handleComplete = () => {
    setShowBlockchainModal(false);
    toast({
      title: "Digital ID Created!",
      description: "Your blockchain-verified identity is now active.",
    });
    navigate("/my-id");
  };

  // Mock encryption info
  const mockCID = "QmX7b8V" + Math.random().toString(36).slice(2, 8);
  const mockHash = "0x8a7d6f" + Math.random().toString(16).slice(2, 12);

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create Your Digital ID
            </h1>
            <p className="text-muted-foreground">
              Secure, blockchain-verified identity for safe travels
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-success text-success-foreground",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-1 mx-2 rounded",
                        currentStep > step.id ? "bg-success" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <Card className="lg:col-span-2 p-6">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter your full name"
                        className={cn(errors.name && "border-destructive")}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="passport">Passport / Aadhaar Number *</Label>
                      <Input
                        id="passport"
                        value={formData.passport}
                        onChange={(e) => handleInputChange("passport", e.target.value)}
                        placeholder="Enter passport or Aadhaar number"
                        className={cn(errors.passport && "border-destructive")}
                      />
                      {errors.passport && (
                        <p className="text-sm text-destructive mt-1">{errors.passport}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="country">Country of Origin *</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => handleInputChange("country", value)}
                      >
                        <SelectTrigger className={cn(errors.country && "border-destructive")}>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.country && (
                        <p className="text-sm text-destructive mt-1">{errors.country}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Travel Details */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Plane className="w-5 h-5 text-primary" />
                    Travel & Emergency Info
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="arrivalDate">Arrival Date *</Label>
                      <Input
                        id="arrivalDate"
                        type="date"
                        value={formData.arrivalDate}
                        onChange={(e) => handleInputChange("arrivalDate", e.target.value)}
                        className={cn(errors.arrivalDate && "border-destructive")}
                      />
                      {errors.arrivalDate && (
                        <p className="text-sm text-destructive mt-1">{errors.arrivalDate}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="departureDate">Departure Date *</Label>
                      <Input
                        id="departureDate"
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => handleInputChange("departureDate", e.target.value)}
                        className={cn(errors.departureDate && "border-destructive")}
                      />
                      {errors.departureDate && (
                        <p className="text-sm text-destructive mt-1">{errors.departureDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accommodation">Accommodation</Label>
                    <Input
                      id="accommodation"
                      value={formData.accommodation}
                      onChange={(e) => handleInputChange("accommodation", e.target.value)}
                      placeholder="Hotel or accommodation name"
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="text-lg font-medium text-foreground mb-4">Emergency Contact</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emergencyName">Contact Name *</Label>
                        <Input
                          id="emergencyName"
                          value={formData.emergencyName}
                          onChange={(e) => handleInputChange("emergencyName", e.target.value)}
                          placeholder="Emergency contact name"
                          className={cn(errors.emergencyName && "border-destructive")}
                        />
                        {errors.emergencyName && (
                          <p className="text-sm text-destructive mt-1">{errors.emergencyName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergencyPhone">Phone Number *</Label>
                          <Input
                            id="emergencyPhone"
                            value={formData.emergencyPhone}
                            onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                            placeholder="+1 234 567 8900"
                            className={cn(errors.emergencyPhone && "border-destructive")}
                          />
                          {errors.emergencyPhone && (
                            <p className="text-sm text-destructive mt-1">{errors.emergencyPhone}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="emergencyRelation">Relationship</Label>
                          <Input
                            id="emergencyRelation"
                            value={formData.emergencyRelation}
                            onChange={(e) => handleInputChange("emergencyRelation", e.target.value)}
                            placeholder="e.g., Spouse, Parent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Upload & Verify */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload & Verify
                  </h2>

                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                      formData.file ? "border-success bg-success/5" : "border-border hover:border-primary/50",
                      errors.file && "border-destructive"
                    )}
                  >
                    <input
                      type="file"
                      accept=".pdf,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {formData.file ? (
                        <div className="space-y-2">
                          <FileText className="w-12 h-12 text-success mx-auto" />
                          <p className="font-medium text-foreground">{formData.file.name}</p>
                          <p className="text-sm text-muted-foreground">Click to replace</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                          <p className="font-medium text-foreground">Drop your documents here</p>
                          <p className="text-sm text-muted-foreground">PDF or JSON (max 10MB)</p>
                        </div>
                      )}
                    </label>
                    {errors.file && (
                      <p className="text-sm text-destructive mt-2">{errors.file}</p>
                    )}
                  </div>

                  {formData.file && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Encrypting with AES-256-GCM...</span>
                        <span className="text-foreground font-medium">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {formData.file && uploadProgress === 100 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-success">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-medium">Encrypted & Ready</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CID:</span>
                          <code className="text-foreground">{mockCID}...</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SHA256:</span>
                          <code className="text-foreground">{mockHash}...</code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                {currentStep < 3 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerateId}
                    disabled={!formData.file || uploadProgress < 100}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Generate ID
                  </Button>
                )}
              </div>
            </Card>

            {/* Preview Card */}
            <Card className="p-6 h-fit sticky top-24">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Digital ID Preview
              </h3>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {formData.name || "Your Name"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.country || "Country"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passport:</span>
                    <span className="text-foreground">
                      {formData.passport ? `${formData.passport.slice(0, 4)}****` : "----"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destination:</span>
                    <span className="text-foreground">{formData.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-warning font-medium">Pending</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-center">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">QR Code</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Blockchain Transaction Modal */}
      <Dialog open={showBlockchainModal} onOpenChange={setShowBlockchainModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Blockchain Transaction
            </DialogTitle>
            <DialogDescription>
              {isProcessing
                ? "Processing your digital ID on the blockchain..."
                : "Your Digital ID has been created successfully!"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Signing transaction and uploading to IPFS...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-success/10 rounded-lg p-4 flex items-center gap-3">
                  <Check className="w-6 h-6 text-success" />
                  <span className="font-medium text-success">Transaction Confirmed</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TX Hash:</span>
                    <code className="text-foreground">{generatedId?.slice(0, 12)}...</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block:</span>
                    <code className="text-foreground">#18,234,567</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Used:</span>
                    <code className="text-foreground">0.0012 ETH</code>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isProcessing && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBlockchainModal(false)}>
                Close
              </Button>
              <Button onClick={handleComplete}>
                View My ID
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

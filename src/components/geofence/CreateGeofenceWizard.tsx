import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Circle,
  Hexagon,
  MapPin,
  Clock,
  Bell,
  Users,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface CreateGeofenceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (fence: NewGeofence) => void;
}

interface NewGeofence {
  name: string;
  description: string;
  type: string;
  fenceType: "circle" | "polygon";
  lat: string;
  lng: string;
  radius?: string;
  vertices?: { lat: number; lng: number }[];
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialState: NewGeofence = {
  name: "",
  description: "",
  type: "safe_zone",
  fenceType: "polygon",
  lat: "",
  lng: "",
  radius: "500",
  scheduled: false,
  scheduleDays: [],
  notifyOnEntry: true,
  notifyOnExit: true,
  notifyBreach: true,
  notifyTargets: ["tourist"],
  severity: "medium",
  linkedTourists: [],
};

export function CreateGeofenceWizard({
  open,
  onOpenChange,
  onComplete,
}: CreateGeofenceWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<NewGeofence>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 2) {
      if (!formData.lat || isNaN(parseFloat(formData.lat))) {
        newErrors.lat = "Valid latitude required";
      }
      if (!formData.lng || isNaN(parseFloat(formData.lng))) {
        newErrors.lng = "Valid longitude required";
      }
      if (formData.fenceType === "circle" && (!formData.radius || isNaN(parseFloat(formData.radius)))) {
        newErrors.radius = "Valid radius required";
      }
    }

    if (stepNum === 3) {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    if (validateStep(3)) {
      onComplete(formData);
      setFormData(initialState);
      setStep(1);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    setStep(1);
    setErrors({});
    onOpenChange(false);
  };

  const updateForm = (updates: Partial<NewGeofence>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const updatedKeys = Object.keys(updates);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedKeys.forEach((key) => delete newErrors[key]);
      return newErrors;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Create New Geo-Fence
          </DialogTitle>
          <DialogDescription>
            Step {step} of 4: {step === 1 ? "Select Fence Type" : step === 2 ? "Define Boundary" : step === 3 ? "Configure Rules" : "Review & Create"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Fence Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose the type of fence boundary:</p>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={cn(
                  "p-6 cursor-pointer transition-all hover:border-primary",
                  formData.fenceType === "circle" && "border-primary bg-primary/5"
                )}
                onClick={() => updateForm({ fenceType: "circle" })}
                role="button"
                tabIndex={0}
                aria-pressed={formData.fenceType === "circle"}
                onKeyDown={(e) => e.key === "Enter" && updateForm({ fenceType: "circle" })}
              >
                <div className="text-center">
                  <Circle className={cn(
                    "w-12 h-12 mx-auto mb-3",
                    formData.fenceType === "circle" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="font-medium text-foreground">Circle Fence</p>
                  <p className="text-xs text-muted-foreground mt-1">Radius-based boundary</p>
                </div>
              </Card>
              <Card
                className={cn(
                  "p-6 cursor-pointer transition-all hover:border-primary",
                  formData.fenceType === "polygon" && "border-primary bg-primary/5"
                )}
                onClick={() => updateForm({ fenceType: "polygon" })}
                role="button"
                tabIndex={0}
                aria-pressed={formData.fenceType === "polygon"}
                onKeyDown={(e) => e.key === "Enter" && updateForm({ fenceType: "polygon" })}
              >
                <div className="text-center">
                  <Hexagon className={cn(
                    "w-12 h-12 mx-auto mb-3",
                    formData.fenceType === "polygon" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="font-medium text-foreground">Polygon Fence</p>
                  <p className="text-xs text-muted-foreground mt-1">Custom shape boundary</p>
                </div>
              </Card>
            </div>

            <div>
              <Label htmlFor="zoneType">Zone Type</Label>
              <Select value={formData.type} onValueChange={(v) => updateForm({ type: v })}>
                <SelectTrigger id="zoneType" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safe_zone">Safe Zone</SelectItem>
                  <SelectItem value="monitored_zone">Monitored Zone</SelectItem>
                  <SelectItem value="restricted_zone">Restricted Zone</SelectItem>
                  <SelectItem value="transport_hub">Transport Hub</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Define Boundary */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {formData.fenceType === "circle"
                ? "Enter the center coordinates and radius:"
                : "Enter the center point (polygon vertices will be auto-generated):"}
            </p>

            {/* Mock Map Preview */}
            <div className="h-32 bg-muted/50 rounded-lg border border-border flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">
                  {formData.lat && formData.lng
                    ? `${formData.lat}, ${formData.lng}`
                    : "Enter coordinates below"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="centerLat">Center Latitude *</Label>
                <Input
                  id="centerLat"
                  value={formData.lat}
                  onChange={(e) => updateForm({ lat: e.target.value })}
                  placeholder="13.7563"
                  className={cn(errors.lat && "border-destructive")}
                  aria-invalid={!!errors.lat}
                />
                {errors.lat && <p className="text-xs text-destructive mt-1">{errors.lat}</p>}
              </div>
              <div>
                <Label htmlFor="centerLng">Center Longitude *</Label>
                <Input
                  id="centerLng"
                  value={formData.lng}
                  onChange={(e) => updateForm({ lng: e.target.value })}
                  placeholder="100.5018"
                  className={cn(errors.lng && "border-destructive")}
                  aria-invalid={!!errors.lng}
                />
                {errors.lng && <p className="text-xs text-destructive mt-1">{errors.lng}</p>}
              </div>
            </div>

            {formData.fenceType === "circle" && (
              <div>
                <Label htmlFor="radius">Radius (meters) *</Label>
                <Input
                  id="radius"
                  value={formData.radius}
                  onChange={(e) => updateForm({ radius: e.target.value })}
                  placeholder="500"
                  className={cn(errors.radius && "border-destructive")}
                  aria-invalid={!!errors.radius}
                />
                {errors.radius && <p className="text-xs text-destructive mt-1">{errors.radius}</p>}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {formData.fenceType === "polygon"
                ? "Tip: After creation, use 'Edit on Map' to adjust polygon vertices."
                : "Tip: The radius defines the boundary distance from the center point."}
            </p>
          </div>
        )}

        {/* Step 3: Configure Rules */}
        {step === 3 && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div>
              <Label htmlFor="fenceName">Fence Name *</Label>
              <Input
                id="fenceName"
                value={formData.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                placeholder="e.g., Beach Safety Zone"
                className={cn(errors.name && "border-destructive")}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="fenceDesc">Description</Label>
              <Input
                id="fenceDesc"
                value={formData.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                placeholder="Brief description of this zone"
              />
            </div>

            {/* Schedule Section */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="scheduled" className="mb-0">Schedule Activation</Label>
                </div>
                <Switch
                  id="scheduled"
                  checked={formData.scheduled}
                  onCheckedChange={(v) => updateForm({ scheduled: v })}
                />
              </div>

              {formData.scheduled && (
                <div className="space-y-3 pl-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="startTime" className="text-xs">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.scheduleStart || ""}
                        onChange={(e) => updateForm({ scheduleStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-xs">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.scheduleEnd || ""}
                        onChange={(e) => updateForm({ scheduleEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Active Days</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          className={cn(
                            "px-2 py-1 text-xs rounded border transition-colors",
                            formData.scheduleDays.includes(day)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:border-primary"
                          )}
                          onClick={() => {
                            const newDays = formData.scheduleDays.includes(day)
                              ? formData.scheduleDays.filter((d) => d !== day)
                              : [...formData.scheduleDays, day];
                            updateForm({ scheduleDays: newDays });
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Alert Rules Section */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Label className="mb-0">Alert Rules</Label>
              </div>

              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyEntry"
                    checked={formData.notifyOnEntry}
                    onCheckedChange={(v) => updateForm({ notifyOnEntry: !!v })}
                  />
                  <Label htmlFor="notifyEntry" className="text-sm mb-0">Notify on entry</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyExit"
                    checked={formData.notifyOnExit}
                    onCheckedChange={(v) => updateForm({ notifyOnExit: !!v })}
                  />
                  <Label htmlFor="notifyExit" className="text-sm mb-0">Notify on exit</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyBreach"
                    checked={formData.notifyBreach}
                    onCheckedChange={(v) => updateForm({ notifyBreach: !!v })}
                  />
                  <Label htmlFor="notifyBreach" className="text-sm mb-0">Notify on breach (after hours)</Label>
                </div>
              </div>

              <div className="pl-6">
                <Label htmlFor="severity" className="text-xs">Alert Severity</Label>
                <Select value={formData.severity} onValueChange={(v: "low" | "medium" | "high") => updateForm({ severity: v })}>
                  <SelectTrigger id="severity" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linked Tourists (placeholder) */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <Label className="mb-0">Linked Tourists</Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                You can link specific tourists after creation.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/30">
              <h4 className="font-medium text-foreground mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="text-foreground font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground capitalize">{formData.type.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Boundary:</span>
                  <span className="text-foreground capitalize">{formData.fenceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Center:</span>
                  <span className="text-foreground">{formData.lat}, {formData.lng}</span>
                </div>
                {formData.fenceType === "circle" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Radius:</span>
                    <span className="text-foreground">{formData.radius}m</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="text-foreground">{formData.scheduled ? "Scheduled" : "Always Active"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Severity:</span>
                  <span className={cn(
                    "capitalize",
                    formData.severity === "high" && "text-destructive",
                    formData.severity === "medium" && "text-warning",
                    formData.severity === "low" && "text-primary"
                  )}>{formData.severity}</span>
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>Ready to create geofence</span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={step === 1 ? handleClose : handleBack}
          >
            {step === 1 ? "Cancel" : (
              <>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </>
            )}
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              <Check className="w-4 h-4 mr-1" />
              Create Fence
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

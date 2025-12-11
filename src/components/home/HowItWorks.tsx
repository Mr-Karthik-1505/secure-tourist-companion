import { useState } from "react";
import { Lock, MapPin, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HowItWorksStep {
  icon: typeof Lock;
  title: string;
  description: string;
  modalContent: {
    title: string;
    description: string;
    details: string[];
  };
}

const steps: HowItWorksStep[] = [
  {
    icon: Lock,
    title: "Data Privacy",
    description: "End-to-end encryption with AES-256-GCM",
    modalContent: {
      title: "Advanced Data Privacy",
      description: "Your data is protected with military-grade encryption.",
      details: [
        "AES-256-GCM encryption for all personal data",
        "Zero-knowledge proofs for identity verification",
        "Decentralized storage on IPFS",
        "No plain-text data on servers",
        "User-controlled data sharing permissions",
      ],
    },
  },
  {
    icon: MapPin,
    title: "Geo-Fencing",
    description: "Smart location boundaries for safety",
    modalContent: {
      title: "Intelligent Geo-Fencing",
      description: "Virtual boundaries that keep you safe.",
      details: [
        "Real-time location monitoring",
        "Customizable safe zones",
        "Automatic alerts on boundary breach",
        "Emergency contact notifications",
        "Integration with local authorities",
      ],
    },
  },
  {
    icon: Siren,
    title: "Emergency Response",
    description: "Coordinated incident management",
    modalContent: {
      title: "Rapid Emergency Response",
      description: "24/7 coordinated response system.",
      details: [
        "One-tap SOS activation",
        "GPS location sharing with responders",
        "Multi-language support",
        "Medical history access for first responders",
        "Real-time incident tracking",
      ],
    },
  },
];

export function HowItWorks() {
  const [openModal, setOpenModal] = useState<number | null>(null);

  const handleStepClick = (index: number) => {
    setOpenModal(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleStepClick(index);
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container-main">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three pillars of tourist safety powered by cutting-edge technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className={cn(
                  "flex flex-col items-center text-center p-6 rounded-xl",
                  "bg-card border border-border/50",
                  "cursor-pointer transition-all duration-300",
                  "hover:shadow-lg hover:-translate-y-1 hover:border-primary/30",
                  "focus-ring"
                )}
                onClick={() => handleStepClick(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                tabIndex={0}
                role="button"
                aria-label={`Learn more about ${step.title}`}
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {steps.map((step, index) => (
        <Dialog key={step.title} open={openModal === index} onOpenChange={() => setOpenModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                {step.modalContent.title}
              </DialogTitle>
              <DialogDescription>
                {step.modalContent.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {step.modalContent.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-sm text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setOpenModal(null)}>Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </section>
  );
}

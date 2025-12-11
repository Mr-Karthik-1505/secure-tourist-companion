import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Bell, IdCard, AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCard {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  state?: Record<string, unknown>;
  color: "primary" | "accent" | "destructive";
}

const features: FeatureCard[] = [
  {
    title: "Real-time Safety Alerts",
    description: "Instant notifications for emergencies, geofence breaches, and security advisories.",
    icon: Bell,
    path: "/alerts",
    state: { filter: "high" },
    color: "destructive",
  },
  {
    title: "Digital ID Issuance",
    description: "Secure blockchain-based identity with encrypted KYC data and zero-knowledge proofs.",
    icon: IdCard,
    path: "/register",
    state: { openModal: true },
    color: "primary",
  },
  {
    title: "Incident Response",
    description: "Coordinated emergency response with real-time tracking and dispatch management.",
    icon: AlertTriangle,
    path: "/response",
    state: { highlight: "reported" },
    color: "accent",
  },
];

const colorClasses = {
  primary: {
    bg: "bg-primary/10 group-hover:bg-primary/20",
    icon: "text-primary",
    border: "border-primary/20",
  },
  accent: {
    bg: "bg-accent/10 group-hover:bg-accent/20",
    icon: "text-accent",
    border: "border-accent/20",
  },
  destructive: {
    bg: "bg-destructive/10 group-hover:bg-destructive/20",
    icon: "text-destructive",
    border: "border-destructive/20",
  },
};

export function FeatureCards() {
  const navigate = useNavigate();

  const handleCardClick = (feature: FeatureCard) => {
    navigate(feature.path, { state: feature.state });
  };

  const handleKeyDown = (e: React.KeyboardEvent, feature: FeatureCard) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick(feature);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature) => {
        const Icon = feature.icon;
        const colors = colorClasses[feature.color];

        return (
          <Card
            key={feature.title}
            className={cn(
              "group p-6 cursor-pointer transition-all duration-300",
              "card-elevated card-hover",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            )}
            onClick={() => handleCardClick(feature)}
            onKeyDown={(e) => handleKeyDown(e, feature)}
            tabIndex={0}
            role="button"
            aria-label={`${feature.title}: ${feature.description}`}
          >
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors",
                colors.bg,
                colors.border,
                "border"
              )}
            >
              <Icon className={cn("w-7 h-7", colors.icon)} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

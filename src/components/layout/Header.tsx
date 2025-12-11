import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, MapPin, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: User, label: "My Digital ID", path: "/my-id" },
  { icon: MapPin, label: "Geo-Fence", path: "/geofence" },
  { icon: Shield, label: "KYC Dashboard", path: "/kyc-dashboard" },
  { icon: Bell, label: "Alerts", path: "/alerts", badge: 3 },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-card/95 backdrop-blur-md border-b border-border z-50">
      <div className="container-main h-full flex items-center justify-between">
        {/* Logo & Title */}
        <Link
          to="/"
          className="flex items-center gap-3 focus-ring rounded-lg p-1 -m-1 transition-transform hover:scale-[1.02]"
          aria-label="Go to homepage"
        >
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              Smart Tourist Safety
            </h1>
            <p className="text-xs text-muted-foreground">
              AI • Geo-Fencing • Blockchain ID
            </p>
          </div>
        </Link>

        {/* Navigation Icons */}
        <nav className="flex items-center gap-1 sm:gap-2" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "relative icon-btn",
                      isActive && "bg-primary/10 text-primary"
                    )}
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center badge-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

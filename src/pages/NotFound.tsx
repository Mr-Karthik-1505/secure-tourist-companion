import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPinOff, Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="container-main py-16 lg:py-24">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <MapPinOff className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => navigate("/home")}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/alerts")}
              >
                Alerts
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/geofence")}
              >
                Geofence
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/kyc-dashboard")}
              >
                KYC Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/contact")}
              >
                Contact
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default NotFound;
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { FeatureCards } from "@/components/home/FeatureCards";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Shield, Users, Globe, Activity } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const handleViewId = (userId: string) => {
    navigate(`/my-id?user=${userId}`);
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="min-h-[420px] bg-gradient-hero relative overflow-hidden">
        <div className="container-main py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Shield className="w-4 h-4" />
                Tourist Safety Platform
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Smart Tourist{" "}
                <span className="text-gradient">Safety</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-muted-foreground max-w-lg">
                AI • Geo-Fencing • Blockchain ID
              </p>
              
              <p className="text-muted-foreground max-w-lg">
                Secure your journey with blockchain-verified digital identity, 
                real-time location monitoring, and instant emergency response.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  variant="hero"
                  onClick={() => navigate("/register")}
                  className="ripple"
                >
                  Get Digital ID
                </Button>
                <Button
                  variant="heroOutline"
                  onClick={() => navigate("/kyc-dashboard")}
                >
                  Explore KYC
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">12.5K+</p>
                    <p className="text-xs text-muted-foreground">Protected Tourists</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">48</p>
                    <p className="text-xs text-muted-foreground">Countries</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">99.9%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Interactive Map */}
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <InteractiveMap
                onViewId={handleViewId}
                className="w-full h-[320px] lg:h-[380px] rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </section>

      {/* Feature Cards Section */}
      <section className="py-16">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              Core Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive safety tools designed for modern travelers.
            </p>
          </div>
          <FeatureCards />
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container-main text-center">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Ready to Travel Safely?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of protected travelers with blockchain-verified identity.
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={() => navigate("/register")}
            className="ripple"
          >
            Create Your Digital ID
          </Button>
        </div>
      </section>

      {/* Live notification region for accessibility */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {/* Dynamic notifications would be announced here */}
      </div>
    </MainLayout>
  );
}

import { MainLayout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Scale, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Terms() {
  const { toast } = useToast();

  const handleDownloadPDF = () => {
    toast({
      title: "Download Started",
      description: "Terms of Service PDF is being generated...",
    });
  };

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">
              Last updated: December 10, 2024
            </p>
          </div>

          <Card className="p-8">
            <div className="prose prose-sm max-w-none">
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">
                    Acceptance of Terms
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using the Smart Tourist Safety platform, you agree to be bound 
                  by these Terms of Service. If you do not agree to these terms, please do not 
                  use our services. We reserve the right to modify these terms at any time, and 
                  your continued use constitutes acceptance of such modifications.
                </p>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">
                    User Responsibilities
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  As a user of our platform, you agree to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Provide accurate and truthful information during registration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Keep your Digital ID credentials secure and confidential</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Enable location services for safety monitoring features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Comply with local laws and regulations of your destination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Not misuse the emergency alert system</span>
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">
                    Service Limitations
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  While we strive to provide reliable safety services, we cannot guarantee 
                  uninterrupted service availability. Our platform is designed to supplement, 
                  not replace, standard emergency services. In life-threatening situations, 
                  always contact local emergency services directly (911, 112, or local equivalent).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Blockchain & Digital ID
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your Digital ID is stored on a blockchain network. Once created, the 
                  transaction is immutable. However, you can revoke your ID at any time, 
                  which will invalidate it for verification purposes. Gas fees for 
                  blockchain transactions are the responsibility of the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, Smart Tourist Safety and its 
                  affiliates shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages resulting from your use of the platform. 
                  Our total liability shall not exceed the amount paid by you, if any, for 
                  accessing our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Governing Law
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  These terms shall be governed by and construed in accordance with the 
                  laws of the jurisdiction in which our services are primarily provided, 
                  without regard to its conflict of law provisions.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <Button onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

import { MainLayout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Download, Lock, Eye, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";

export default function Policy() {
  const { toast } = useToast();

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(11, 110, 79);
    doc.text("Privacy Policy", 105, 20, { align: "center" });
    
    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text("Smart Tourist Safety Platform", 105, 28, { align: "center" });
    doc.text("Last updated: December 10, 2024", 105, 34, { align: "center" });
    
    // Content
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let y = 50;
    
    doc.setFontSize(14);
    doc.text("1. Data Encryption", 20, y);
    y += 10;
    doc.setFontSize(10);
    const encryptionText = "All personal data is encrypted using AES-256-GCM encryption before storage. This military-grade encryption ensures that your data remains secure and unreadable to unauthorized parties.";
    const splitEncryption = doc.splitTextToSize(encryptionText, 170);
    doc.text(splitEncryption, 20, y);
    y += splitEncryption.length * 5 + 10;
    
    doc.setFontSize(14);
    doc.text("2. Data Collection", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text("We collect the following information:", 20, y);
    y += 7;
    doc.text("• Personal identification (name, passport/ID number)", 25, y);
    y += 6;
    doc.text("• Travel information (dates, destinations, accommodation)", 25, y);
    y += 6;
    doc.text("• Emergency contact details", 25, y);
    y += 6;
    doc.text("• Location data (for geofencing safety features)", 25, y);
    y += 15;
    
    doc.setFontSize(14);
    doc.text("3. Data Usage", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text("Your data is used exclusively for:", 20, y);
    y += 7;
    doc.text("• Identity verification and digital ID issuance", 25, y);
    y += 6;
    doc.text("• Safety monitoring and geofence alerts", 25, y);
    y += 6;
    doc.text("• Emergency response coordination", 25, y);
    y += 6;
    doc.text("• Communication with emergency contacts when necessary", 25, y);
    y += 15;
    
    doc.setFontSize(14);
    doc.text("4. Your Rights", 20, y);
    y += 10;
    doc.setFontSize(10);
    const rightsText = "You have the right to access, modify, or delete your personal data at any time. You can revoke your Digital ID through the dashboard, which will remove all associated data from our systems. We comply with GDPR and other applicable data protection regulations.";
    const splitRights = doc.splitTextToSize(rightsText, 170);
    doc.text(splitRights, 20, y);
    y += splitRights.length * 5 + 15;
    
    doc.setFontSize(14);
    doc.text("5. Contact Us", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text("For privacy inquiries: privacy@tourist-safety.io", 20, y);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("© 2024 Smart Tourist Safety. All rights reserved.", 105, 285, { align: "center" });
    
    doc.save("privacy-policy.pdf");
    
    toast({
      title: "Download Complete",
      description: "Privacy Policy PDF has been downloaded.",
    });
  };

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">
              Last updated: December 10, 2024
            </p>
          </div>

          <Card className="p-8">
            <div className="prose prose-sm max-w-none">
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">
                    Data Encryption
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  All personal data is encrypted using AES-256-GCM encryption before storage. 
                  This military-grade encryption ensures that your data remains secure and 
                  unreadable to unauthorized parties. Encryption keys are managed using 
                  industry-standard key management practices.
                </p>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">
                    Data Collection
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect the following information to provide our services:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Personal identification (name, passport/ID number)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Travel information (dates, destinations, accommodation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Emergency contact details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Location data (for geofencing safety features)</span>
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground m-0">
                    Data Usage
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Your data is used exclusively for:
                </p>
                <ul className="space-y-2 text-muted-foreground mt-4">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Identity verification and digital ID issuance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Safety monitoring and geofence alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Emergency response coordination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Communication with emergency contacts when necessary</span>
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Your Rights
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to access, modify, or delete your personal data at any time. 
                  You can revoke your Digital ID through the dashboard, which will remove all 
                  associated data from our systems. We comply with GDPR and other applicable 
                  data protection regulations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Contact Us
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  For any privacy-related inquiries, please contact our Data Protection Officer 
                  at privacy@tourist-safety.io or visit our Contact page.
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

import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Phone,
  Shield,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import incidentsData from "@/data/incidents.json";
import usersData from "@/data/users.json";

const severityColors: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  reported: "bg-destructive/10 text-destructive border-destructive/20",
  assigned: "bg-warning/10 text-warning border-warning/20",
  responding: "bg-accent/10 text-accent border-accent/20",
  resolved: "bg-success/10 text-success border-success/20",
};

export default function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const incident = incidentsData.find((i) => i.id === id);
  const affectedUser = usersData.find((u) => u.id === incident?.affectedUser);

  if (!incident) {
    return (
      <MainLayout>
        <div className="container-main py-12 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Incident Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The incident you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/alerts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Alerts
          </Button>
        </div>
      </MainLayout>
    );
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <MainLayout>
      <div className="container-main py-8 lg:py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/alerts")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Alerts
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      incident.severity === "high" && "bg-destructive/10",
                      incident.severity === "medium" && "bg-warning/10",
                      incident.severity === "low" && "bg-muted"
                    )}
                  >
                    <AlertTriangle
                      className={cn(
                        "w-6 h-6",
                        incident.severity === "high" && "text-destructive",
                        incident.severity === "medium" && "text-warning",
                        incident.severity === "low" && "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {incident.title}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={severityColors[incident.severity]}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={statusColors[incident.status]}>
                        {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-muted-foreground">{incident.description}</p>
              </div>

              <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{incident.location.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{formatTime(incident.timestamp)}</span>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
              <div className="space-y-4">
                {incident.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {index < incident.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-muted-foreground">
                        {formatTime(event.time)}
                      </p>
                      <p className="text-sm text-foreground mt-1">{event.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Attachments */}
            {incident.attachments.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Attachments
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {incident.attachments.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Affected User */}
            {affectedUser && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Affected Tourist
                </h2>
                <div className="flex items-center gap-4">
                  <img
                    src={affectedUser.photo}
                    alt={affectedUser.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">{affectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{affectedUser.country}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={cn(
                        "font-medium",
                        affectedUser.status === "verified" && "text-success",
                        affectedUser.status === "pending" && "text-warning",
                        affectedUser.status === "alert" && "text-destructive"
                      )}
                    >
                      {affectedUser.status.charAt(0).toUpperCase() + affectedUser.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Passport:</span>
                    <span className="text-foreground">{affectedUser.passport}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/my-id?user=${affectedUser.id}`)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  View Digital ID
                </Button>
              </Card>
            )}

            {/* Emergency Contact */}
            {affectedUser && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Emergency Contact
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="text-foreground">{affectedUser.emergencyContact.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Relation:</span>
                    <span className="text-foreground">{affectedUser.emergencyContact.relation}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-foreground">{affectedUser.emergencyContact.phone}</span>
                  </div>
                </div>
                <Button className="w-full mt-4">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Emergency Contact
                </Button>
              </Card>
            )}

            {/* Responders */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Assigned Responders</h2>
              {incident.responders.length > 0 ? (
                <div className="space-y-2">
                  {incident.responders.map((responder, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{responder}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No responders assigned yet.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import MyId from "./pages/MyId";
import Geofence from "./pages/Geofence";
import KYCDashboard from "./pages/KYCDashboard";
import Alerts from "./pages/Alerts";
import AlertDetail from "./pages/AlertDetail";
import Response from "./pages/Response";
import ControlRoom from "./pages/ControlRoom";
import AuditLog from "./pages/AuditLog";
import Policy from "./pages/Policy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my-id" element={<MyId />} />
            <Route path="/geofence" element={<Geofence />} />
            <Route path="/geofence/create" element={<Geofence />} />
            <Route path="/geofence/edit/:fenceId" element={<Geofence />} />
            <Route path="/geofence/history/:fenceId" element={<Geofence />} />
            <Route path="/kyc-dashboard" element={<KYCDashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/:id" element={<AlertDetail />} />
            <Route path="/response" element={<Response />} />
            <Route path="/control-room" element={<ControlRoom />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;

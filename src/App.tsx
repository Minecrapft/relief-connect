import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import BeneficiaryLayout from "./layouts/BeneficiaryLayout";
import StaffLayout from "./layouts/StaffLayout";
import AdminLayout from "./layouts/AdminLayout";
import BeneficiaryHome from "./pages/beneficiary/BeneficiaryHome";
import BeneficiaryHistory from "./pages/beneficiary/BeneficiaryHistory";
import BeneficiaryProfile from "./pages/beneficiary/BeneficiaryProfile";
import StaffEvents from "./pages/staff/StaffEvents";
import StaffScan from "./pages/staff/StaffScan";
import StaffRecent from "./pages/staff/StaffRecent";
import AdminHome from "./pages/admin/AdminHome";
import { AdminEvents, AdminInventory, AdminBeneficiaries, AdminStaff } from "./pages/admin/AdminPlaceholders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Beneficiary */}
            <Route path="/me" element={<ProtectedRoute allowedRoles={["beneficiary"]}><BeneficiaryLayout /></ProtectedRoute>}>
              <Route index element={<BeneficiaryHome />} />
              <Route path="history" element={<BeneficiaryHistory />} />
              <Route path="profile" element={<BeneficiaryProfile />} />
            </Route>

            {/* Staff */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={["staff", "admin"]}><StaffLayout /></ProtectedRoute>}>
              <Route index element={<StaffEvents />} />
              <Route path="scan" element={<StaffScan />} />
              <Route path="recent" element={<StaffRecent />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminHome />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="beneficiaries" element={<AdminBeneficiaries />} />
              <Route path="staff" element={<AdminStaff />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewAsRoleProvider } from "@/hooks/useViewAsRole";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CompleteProfile from "./pages/CompleteProfile";
import Dashboard from "./pages/Dashboard";
import Research from "./pages/Research";
import Drafting from "./pages/Drafting";
import ECourts from "./pages/ECourts";
import StudentTools from "./pages/StudentTools";
import Admin from "./pages/Admin";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import NotFound from "./pages/NotFound";
import Contracts from "./pages/Contracts";
import CalendarPage from "./pages/Calendar";
import Finance from "./pages/Finance";
import Analytics from "./pages/Analytics";
import ConflictChecker from "./pages/ConflictChecker";
import Documents from "./pages/Documents";
import Team from "./pages/Team";
import FAQ from "./pages/FAQ";
import Accessibility from "./pages/Accessibility";
import KnowledgeBase from "./pages/KnowledgeBase";
import AuditLog from "./pages/AuditLog";
import CompliancePage from "./pages/Compliance";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ViewAsRoleProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/research" element={<ProtectedRoute><AppLayout><Research /></AppLayout></ProtectedRoute>} />
            <Route path="/drafting" element={<ProtectedRoute><AppLayout><Drafting /></AppLayout></ProtectedRoute>} />
            <Route path="/ecourts" element={<ProtectedRoute><AppLayout><ECourts /></AppLayout></ProtectedRoute>} />
            <Route path="/student-tools" element={<ProtectedRoute><AppLayout><StudentTools /></AppLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
            <Route path="/cases" element={<ProtectedRoute><AppLayout><Cases /></AppLayout></ProtectedRoute>} />
            <Route path="/cases/:id" element={<ProtectedRoute><AppLayout><CaseDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><AppLayout><Contracts /></AppLayout></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><AppLayout><CalendarPage /></AppLayout></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><AppLayout><Finance /></AppLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
            <Route path="/conflict-checker" element={<ProtectedRoute><AppLayout><ConflictChecker /></AppLayout></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><AppLayout><Documents /></AppLayout></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><AppLayout><Team /></AppLayout></ProtectedRoute>} />
            <Route path="/knowledge-base" element={<ProtectedRoute><AppLayout><KnowledgeBase /></AppLayout></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute><AppLayout><AuditLog /></AppLayout></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><AppLayout><CompliancePage /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ViewAsRoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

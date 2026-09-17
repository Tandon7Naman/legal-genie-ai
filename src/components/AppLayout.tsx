import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ClearSampleDataButton } from "@/components/onboarding/ClearSampleDataButton";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { RolePreviewBanner } from "@/components/RolePreviewBanner";
import { useViewAsRole } from "@/hooks/useViewAsRole";
import { canAccessRoute } from "@/lib/roleAccess";
import { Navigate } from "react-router-dom";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== "/dashboard";
  const { effectiveRole } = useViewAsRole();
  useIdleLogout();

  const allowed =
    canAccessRoute(effectiveRole, location.pathname) || location.pathname === "/admin";


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border/20 bg-card/30 backdrop-blur-xl sticky top-0 z-40 px-2">
            <div className="flex items-center gap-1">
              <SidebarTrigger className="ml-1" />
              {showBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="hidden md:inline-flex items-center gap-1 text-muted-foreground hover:text-foreground h-8 px-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-xs">Back</span>
                </Button>
              )}
            </div>
            <GlobalSearch />
            <div className="w-8" />
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
        <ClearSampleDataButton />
        <OnboardingTour />
      </div>
    </SidebarProvider>
  );
}

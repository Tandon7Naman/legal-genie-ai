import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { SELECTABLE_ROLES } from "@/lib/roleAccess";

const STORAGE_KEY = "ta_view_as_role";

interface ViewAsRoleContextType {
  /** Role the interface should behave as (preview role for admins, otherwise real role). */
  effectiveRole: UserRole;
  /** Real role from the database. */
  realRole: UserRole;
  /** Admin-only preview override. */
  viewAsRole: UserRole | null;
  setViewAsRole: (role: UserRole | null) => void;
  canSwitchView: boolean;
}

const ViewAsRoleContext = createContext<ViewAsRoleContextType>({
  effectiveRole: "individual_lawyer",
  realRole: "individual_lawyer",
  viewAsRole: null,
  setViewAsRole: () => {},
  canSwitchView: false,
});

export const useViewAsRole = () => useContext(ViewAsRoleContext);

export const ViewAsRoleProvider = ({ children }: { children: ReactNode }) => {
  const { roles, isAdmin } = useAuth();
  const [viewAsRole, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SELECTABLE_ROLES.includes(stored as UserRole)) {
      setRole(stored as UserRole);
    }
  }, []);

  const setViewAsRole = useCallback((role: UserRole | null) => {
    if (role) localStorage.setItem(STORAGE_KEY, role);
    else localStorage.removeItem(STORAGE_KEY);
    setRole(role);
  }, []);

  const realRole: UserRole = isAdmin
    ? "admin"
    : (roles[0] as UserRole) || "individual_lawyer";

  const canSwitchView = isAdmin;
  const effectiveRole = canSwitchView && viewAsRole ? viewAsRole : realRole;

  return (
    <ViewAsRoleContext.Provider
      value={{
        effectiveRole,
        realRole,
        viewAsRole: canSwitchView ? viewAsRole : null,
        setViewAsRole,
        canSwitchView,
      }}
    >
      {children}
    </ViewAsRoleContext.Provider>
  );
};

import type { UserRole } from "@/contexts/AuthContext";

export const SELECTABLE_ROLES: UserRole[] = [
  "student",
  "individual_lawyer",
  "law_firm",
  "organization",
  "admin",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  individual_lawyer: "Individual Lawyer",
  law_firm: "Law Firm",
  organization: "Organization",
  admin: "Admin",
};

/** Sections each role is allowed to see. Admin sees everything. */
const ROLE_ROUTES: Record<UserRole, string[]> = {
  student: [
    "/dashboard",
    "/research",
    "/drafting",
    "/student-tools",
    "/knowledge-base",
    "/ecourts",
    "/calendar",
    "/documents",
    "/settings",
  ],
  individual_lawyer: [
    "/dashboard",
    "/research",
    "/drafting",
    "/cases",
    "/clients",
    "/calendar",
    "/documents",
    "/contracts",
    "/finance",
    "/conflict-checker",
    "/analytics",
    "/ecourts",
    "/knowledge-base",
    "/audit-log",
    "/settings",
  ],
  law_firm: [
    "/dashboard",
    "/research",
    "/drafting",
    "/cases",
    "/clients",
    "/calendar",
    "/documents",
    "/contracts",
    "/finance",
    "/conflict-checker",
    "/analytics",
    "/ecourts",
    "/team",
    "/knowledge-base",
    "/compliance",
    "/audit-log",
    "/settings",
  ],
  organization: [
    "/dashboard",
    "/research",
    "/drafting",
    "/cases",
    "/calendar",
    "/documents",
    "/contracts",
    "/finance",
    "/conflict-checker",
    "/analytics",
    "/ecourts",
    "/team",
    "/knowledge-base",
    "/compliance",
    "/audit-log",
    "/settings",
  ],
  admin: ["*"],
};

export function allowedRoutesFor(role: UserRole): string[] {
  return ROLE_ROUTES[role] ?? ROLE_ROUTES.individual_lawyer;
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowed = allowedRoutesFor(role);
  if (allowed.includes("*")) return true;
  return allowed.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

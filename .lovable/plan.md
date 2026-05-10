## Problem

New users currently can't reliably choose their account type (Student / Individual Lawyer / Law Firm / Organization):

1. **Email signup** — the dropdown exists but uses a dark glass background where the `SelectContent` popover and items can render with low contrast, and the role-conditional fields (Institution, Graduation Year, Firm Name) aren't required, so role data often ends up incomplete.
2. **Google sign-in** — the OAuth flow skips the signup form entirely. The `handle_new_user` trigger then defaults every Google user to `individual_lawyer` with no chance to pick another role.

## Goal

Every new user — email or Google — must explicitly choose a role before reaching the dashboard, and the role + role-specific profile fields must be saved.

## Changes

### 1. Email signup form (`src/pages/Auth.tsx`)
- Make the Account Type `Select` more visible: lift it out of the translucent card styling, give the trigger a solid background, and ensure `SelectContent` uses `bg-popover text-popover-foreground` so options are readable.
- Make role-specific fields **required** when their role is selected (Institution + Graduation Year for Student; Firm/Org Name for Law Firm / Organization).
- Keep current behavior of passing `role` and the extra fields in `signUp` metadata so the existing `handle_new_user` trigger picks them up.

### 2. Post-OAuth role selection step
After Google sign-in, detect users that don't yet have a role row and force them through a one-time "Complete your profile" screen before the dashboard.

- **New page**: `src/pages/CompleteProfile.tsx` at route `/complete-profile`
  - Same role picker (Student / Individual Lawyer / Law Firm / Organization) and conditional fields used in signup.
  - On submit:
    - `INSERT INTO user_roles (user_id, role)` for the chosen role.
    - `UPDATE profiles` with institution / expected_graduation_year / firm_name as applicable, plus `full_name` if missing (prefill from Google metadata).
  - Redirect to `/dashboard` on success.
- **Routing** (`src/App.tsx`): add the protected route `/complete-profile`.
- **Gatekeeper** (`src/components/ProtectedRoute.tsx` or `AuthContext`): if the authenticated user has zero rows in `user_roles`, redirect any protected route to `/complete-profile` (except `/complete-profile` itself). The existing `roles` array in `AuthContext` already exposes this — add a `needsRoleSelection` flag (`!loading && user && roles.length === 0`).
- The `handle_new_user` trigger currently always inserts `individual_lawyer`. To support the post-OAuth picker we need the trigger to **skip role insertion when no role is provided in `raw_user_meta_data`**. This requires a small DB migration:

  ```sql
  -- In handle_new_user(): only insert into user_roles when raw_user_meta_data->>'role' IS NOT NULL
  ```

  Email signup keeps sending `role`, so its behavior is unchanged. Google OAuth has no `role` metadata, so those users land on `/complete-profile`.

### 3. Backfill safety
Existing Google users already auto-assigned `individual_lawyer` are unaffected (they have a role row, so they bypass `/complete-profile`). No data migration needed.

## Files touched

- `src/pages/Auth.tsx` — visibility + required fields on signup role selector
- `src/pages/CompleteProfile.tsx` — new page (role picker for OAuth users)
- `src/App.tsx` — add `/complete-profile` route
- `src/contexts/AuthContext.tsx` — expose `needsRoleSelection`
- `src/components/ProtectedRoute.tsx` — redirect to `/complete-profile` when role missing
- DB migration — update `handle_new_user` to skip role insert when metadata has no `role`

## Out of scope

- Login form (no role needed at login, by design).
- Changing existing users' roles (handled in Settings / Admin already).

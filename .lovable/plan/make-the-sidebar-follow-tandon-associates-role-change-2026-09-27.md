# Make the sidebar follow Tandon Associates' role change

## Why it happens
On the Admin page, the role dropdown in the users list saves the account type, but the Tandon Associates account also keeps its Admin role. Admins always see every tab, so the sidebar never changes. Only the separate "View app as role" card changes the sidebar.

## What changes
1. When you change **your own** row in the users list (e.g. Student to Individual Lawyer), the app also switches your view to that role right away. The sidebar then shows only that role's tabs, with the "Exit preview" banner. Admin access stays.
2. The "View app as role" card updates to show the same role, so the two controls always agree.
3. Choosing "Admin" in your own row (or pressing Exit preview / Reset) brings back all tabs.
4. A short note under your own row: "Changing your own role previews that role. You stay Admin."

## Technical details
- `src/pages/Admin.tsx` `changeRole`: after a successful save, if `userId === user.id`, call `setViewAsRole(newRole === "admin" ? null : newRole)` and `refreshUserData()`.
- No database or role-mapping changes.

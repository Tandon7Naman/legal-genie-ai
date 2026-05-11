TRUNCATE TABLE
  public.activity_log,
  public.billable_hours,
  public.calendar_events,
  public.case_notes,
  public.communication_log,
  public.conflict_checks,
  public.contact_submissions,
  public.contracts,
  public.documents,
  public.hearings,
  public.invoices,
  public.saved_drafts,
  public.search_history,
  public.tasks,
  public.user_dashboard_layouts,
  public.user_preferences,
  public.cases,
  public.clients,
  public.user_roles,
  public.profiles
RESTART IDENTITY CASCADE;

DELETE FROM auth.users;

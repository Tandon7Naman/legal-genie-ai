import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCasesTool from "./tools/list-cases";
import getCaseTool from "./tools/get-case";
import listClientsTool from "./tools/list-clients";
import listUpcomingHearingsTool from "./tools/list-upcoming-hearings";
import createTaskTool from "./tools/create-task";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "legal-genie-ai",
  title: "Legal Genie AI",
  version: "0.1.0",
  instructions:
    "Tools for Legal Genie AI, an Indian legal practice platform. Use `list_cases` and `get_case` to inspect the signed-in user's matters, `list_clients` for their client roster, `list_upcoming_hearings` for their court calendar, and `create_task` to add follow-up work to a case. All data is scoped to the authenticated user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCasesTool, getCaseTool, listClientsTool, listUpcomingHearingsTool, createTaskTool],
});
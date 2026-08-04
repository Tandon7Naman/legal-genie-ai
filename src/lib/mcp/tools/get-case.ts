import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_case",
  title: "Get case detail",
  description: "Fetch one case owned by the signed-in user, with its client, hearings and open tasks.",
  inputSchema: { case_id: z.string().uuid().describe("The case id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ case_id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const [caseRes, hearingsRes, tasksRes] = await Promise.all([
      supabase.from("cases").select("*, clients(id,name,email,phone)").eq("id", case_id).maybeSingle(),
      supabase.from("hearings").select("id,date,court,judge,purpose,outcome,source").eq("case_id", case_id).order("date", { ascending: true }),
      supabase.from("tasks").select("id,title,due_date,completed").eq("case_id", case_id).order("due_date", { ascending: true }),
    ]);
    const error = caseRes.error ?? hearingsRes.error ?? tasksRes.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!caseRes.data) return { content: [{ type: "text", text: "Case not found." }], isError: true };
    const payload = { case: caseRes.data, hearings: hearingsRes.data ?? [], tasks: tasksRes.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
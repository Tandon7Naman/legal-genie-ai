import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Create case task",
  description: "Create a task on one of the signed-in user's cases.",
  inputSchema: {
    case_id: z.string().uuid().describe("The case the task belongs to."),
    title: z.string().trim().min(1).max(300).describe("Short task title."),
    description: z.string().trim().max(4000).optional().describe("Optional task detail."),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Optional due date as YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ case_id, title, description, due_date }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ case_id, title, description: description ?? null, due_date: due_date ?? null, user_id: ctx.getUserId()! })
      .select("id,title,due_date,completed,case_id")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { task: data },
    };
  },
});
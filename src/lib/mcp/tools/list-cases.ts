import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_cases",
  title: "List cases",
  description: "List the signed-in user's legal cases, optionally filtered by status or a text search on the title.",
  inputSchema: {
    search: z.string().trim().max(200).optional().describe("Optional text to match against case titles."),
    status: z.string().trim().max(50).optional().describe("Optional case status filter (e.g. active, closed)."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of cases to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("cases")
      .select("id,title,case_number,cnr_number,court,judge,status,practice_area,next_hearing_date,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (search) query = query.ilike("title", `%${search}%`);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { cases: data ?? [] },
    };
  },
});
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_clients",
  title: "List clients",
  description: "List the signed-in user's clients, optionally filtered by a name search.",
  inputSchema: {
    search: z.string().trim().max(200).optional().describe("Optional text to match against client names."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of clients to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("clients")
      .select("id,name,email,phone,address,notes,created_at")
      .order("name", { ascending: true })
      .limit(limit ?? 20);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { clients: data ?? [] },
    };
  },
});
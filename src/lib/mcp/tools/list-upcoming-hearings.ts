import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_upcoming_hearings",
  title: "List upcoming hearings",
  description: "List the signed-in user's hearings scheduled from today onwards, with case titles.",
  inputSchema: {
    days: z.number().int().min(1).max(365).default(30).describe("How many days ahead to look."),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of hearings to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const today = new Date();
    const until = new Date(today.getTime() + (days ?? 30) * 86_400_000);
    const { data, error } = await supabase
      .from("hearings")
      .select("id,date,court,judge,purpose,outcome,source,cases(id,title,case_number)")
      .gte("date", today.toISOString().slice(0, 10))
      .lte("date", until.toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(limit ?? 25);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { hearings: data ?? [] },
    };
  },
});
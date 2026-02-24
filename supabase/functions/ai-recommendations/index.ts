import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Decode JWT to get user_id
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    ).auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    // Fetch user's data for context
    const [searchRes, casesRes, rolesRes] = await Promise.all([
      supabase
        .from("search_history")
        .select("query_text, query_type, filters, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("cases")
        .select("title, practice_area, status, court")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id),
    ]);

    const searchHistory = searchRes.data || [];
    const cases = casesRes.data || [];
    const roles = (rolesRes.data || []).map((r: any) => r.role);

    // Build context summary
    const practiceAreas = [...new Set(cases.map((c: any) => c.practice_area).filter(Boolean))];
    const recentQueries = searchHistory.slice(0, 10).map((s: any) => s.query_text);
    const queryTypes = searchHistory.reduce((acc: Record<string, number>, s: any) => {
      acc[s.query_type] = (acc[s.query_type] || 0) + 1;
      return acc;
    }, {});

    const systemPrompt = `You are an AI legal assistant for an Indian legal tech platform. Based on the user's activity data, generate personalized recommendations.

You MUST respond using the suggest_recommendations tool. Generate 4-6 actionable, specific recommendations.

Categories must be one of: "case_law", "statute", "document", "learning", "action"
Priority must be one of: "high", "medium", "low"`;

    const userPrompt = `User profile:
- Roles: ${roles.join(", ")}
- Practice areas: ${practiceAreas.length > 0 ? practiceAreas.join(", ") : "Not yet established"}
- Active cases: ${cases.filter((c: any) => c.status === "active").length}
- Total searches: ${searchHistory.length}
- Search types breakdown: ${JSON.stringify(queryTypes)}
- Recent queries: ${recentQueries.length > 0 ? recentQueries.join("; ") : "None yet"}
- Recent case titles: ${cases.slice(0, 5).map((c: any) => c.title).join("; ") || "None"}

Generate personalized "For You" recommendations based on this activity.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_recommendations",
              description: "Return 4-6 personalized legal recommendations for the user.",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short recommendation title" },
                        description: { type: "string", description: "1-2 sentence explanation" },
                        category: { type: "string", enum: ["case_law", "statute", "document", "learning", "action"] },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        actionLabel: { type: "string", description: "CTA button text like 'Research Now' or 'Draft Document'" },
                        actionRoute: { type: "string", description: "Route to navigate: /research or /drafting or /cases" },
                      },
                      required: ["title", "description", "category", "priority", "actionLabel", "actionRoute"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_recommendations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

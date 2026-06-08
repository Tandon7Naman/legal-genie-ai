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
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const { data: { user }, error: _authErr } = await createClient(supaUrl, supaAnon, {
      global: { headers: { Authorization: authHeader } },
    }).auth.getUser();
    if (_authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, filters, mode } = await req.json();
    if (typeof query !== "string" || query.length === 0 || query.length > 10_000) {
      return new Response(JSON.stringify({ error: "query must be a string up to 10000 chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (filters !== undefined && filters !== null) {
      if (typeof filters !== "object" || JSON.stringify(filters).length > 5_000) {
        return new Response(JSON.stringify({ error: "Invalid filters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) { console.error("LOVABLE_API_KEY is not configured"); throw new Error("Service temporarily unavailable"); }

    const isStudent = mode === "student";
    const systemPrompt = isStudent ? `You are a friendly Indian law tutor for students. Provide accurate, grounded answers using simple language, definitions for jargon, and study-friendly structure.

Format your response with these sections:
- **Concepts Covered** (one-line bullets of key terms)
- **Relevant Statutes & Sections** (with plain-English meaning)
- **Landmark Cases** (Party v Party, Year, Court — explain the ratio simply)
- **IRAC Walkthrough** (Issue / Rule / Application / Conclusion)
- **Exam Tips** (what to remember)

If a citation is uncertain, say so clearly.` : `You are an expert Indian legal research assistant. You provide detailed, accurate legal analysis grounded in Indian law.

When given a legal query, you MUST:
1. Identify relevant Indian statutes (IPC, CrPC, CPC, Constitution of India, specific Acts)
2. Reference landmark Supreme Court and High Court judgments with proper citations (Party v Party, Year, Court)
3. Explain the ratio decidendi and key holdings
4. Note any recent amendments or developments
5. Provide practical implications

Format your response with clear sections:
- **Relevant Statutes & Sections**
- **Key Case Law** (with proper citations)
- **Legal Analysis**
- **Practical Implications**

Always cite specific section numbers and case names. If you're uncertain about a specific citation, clearly state that.`;

    let userPrompt = query;
    if (filters) {
      const filterParts: string[] = [];
      if (filters.courtLevel) filterParts.push(`Court: ${filters.courtLevel}`);
      if (filters.yearFrom || filters.yearTo) filterParts.push(`Year range: ${filters.yearFrom || "any"} to ${filters.yearTo || "present"}`);
      if (filters.actSection) filterParts.push(`Act/Section: ${filters.actSection}`);
      if (filters.subjectArea) filterParts.push(`Subject area: ${filters.subjectArea}`);
      if (filterParts.length > 0) {
        userPrompt += `\n\nFilters applied:\n${filterParts.join("\n")}`;
      }
    }

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
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("legal-search error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

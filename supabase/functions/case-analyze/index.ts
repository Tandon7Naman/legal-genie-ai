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

    const { caseDetails, mode } = await req.json();
    if (typeof caseDetails !== "string" || caseDetails.length === 0 || caseDetails.length > 100_000) {
      return new Response(JSON.stringify({ error: "caseDetails must be a string up to 100000 chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) { console.error("LOVABLE_API_KEY is not configured"); throw new Error("Service temporarily unavailable"); }

    const isStudent = mode === "student";
    const systemPrompt = isStudent ? `You are an Indian law professor guiding a student through case analysis. Use clear language and IRAC.

Sections:
- **Facts Summary**
- **Issues Identified**
- **Applicable Rules** (statutes + landmark cases, explained simply)
- **Application (IRAC)** — apply rules to facts
- **Conclusion** — most likely legal outcome with reasoning
- **Learning Points** — concepts to revise

Do not predict win/loss probabilities; focus on legal reasoning.` : `You are a senior Indian litigation strategist with decades of experience. Analyze the provided case details thoroughly.

Provide your analysis in these sections:
- **Case Summary** — Brief overview of the facts and issues
- **Strengths** — Arguments and evidence favoring this position
- **Weaknesses** — Potential vulnerabilities and counterarguments
- **Relevant Precedents** — Cite specific Indian Supreme Court and High Court judgments with full citations
- **Applicable Statutes** — List specific sections of relevant Acts
- **Strategic Recommendations** — Practical next steps
- **Likely Outcome Assessment** — Honest probability assessment with reasoning

Be specific, cite real Indian legal provisions, and provide actionable advice.`;

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
          { role: "user", content: caseDetails },
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("case-analyze error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

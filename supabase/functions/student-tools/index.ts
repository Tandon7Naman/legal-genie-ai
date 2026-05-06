import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL_PROMPTS: Record<string, (params: any) => { system: string; user: string }> = {
  moot_court: ({ topic, side, arguments: args }) => ({
    system: `You are a distinguished Indian Supreme Court judge presiding over a moot court competition. You must:

1. If the student provides arguments, evaluate them critically — score on legal reasoning (1-10), use of precedents (1-10), originality (1-10), and presentation (1-10).
2. If no arguments are provided, simulate a FULL moot court session:
   - Present the case background and constitutional/legal framework
   - Present arguments for the Petitioner side
   - Present arguments for the Respondent side
   - Deliver a detailed judgment with ratio decidendi

Always reference real Indian case law, constitutional provisions, and statutes.
Use proper moot court formatting with headings.
End with constructive feedback for the student.`,
    user: `Moot Court Topic: "${topic}"
Student's Side: ${side}
${args ? `\nStudent's Arguments:\n${args}` : "\nNo arguments provided — please simulate the full moot court proceeding."}`,
  }),

  case_brief: ({ caseText }) => ({
    system: `You are an expert Indian law professor who creates comprehensive case briefs. Generate a structured brief in IRAC format:

## Case Brief

### 1. Citation
Full case name, year, court, and citation

### 2. Facts
Material facts of the case in chronological order

### 3. Issues
Legal questions before the court (numbered)

### 4. Rules
Applicable statutes, sections, and legal principles

### 5. Analysis / Reasoning
Court's reasoning and application of law to facts

### 6. Holding / Decision
The court's final decision

### 7. Ratio Decidendi
The binding legal principle established

### 8. Obiter Dicta
Any additional observations (if relevant)

### 9. Significance
Why this case matters in Indian jurisprudence

If the student provides a case name rather than full text, use your knowledge to generate the brief.`,
    user: caseText,
  }),

  statute_simplifier: ({ statuteText, level }) => ({
    system: `You are an Indian law professor who excels at making complex legal provisions accessible. Simplify the given statute/section for a ${level === "beginner" ? "complete layman with no legal background" : level === "intermediate" ? "first-year law student" : "final-year law student preparing for bar exams"}.

Your explanation must include:
1. **Plain Language Translation** — What this section actually means in simple words
2. **Key Terms Explained** — Define legal jargon used
3. **Real-World Example** — A practical scenario illustrating this provision
4. **Connected Provisions** — Related sections the student should know
5. **Important Case Law** — 2-3 landmark cases interpreting this section
6. **Exam Tips** — Common questions asked about this section
7. **Mnemonics / Memory Aids** — Easy ways to remember key elements

Use bullet points, tables, and clear formatting. Make it engaging and easy to understand.`,
    user: statuteText,
  }),
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

    const body = await req.json();
    const { tool } = body;
    const checkStr = (v: unknown, max: number) =>
      v === undefined || v === null || (typeof v === "string" && v.length <= max);
    if (
      !checkStr(body.topic, 2_000) ||
      !checkStr(body.arguments, 50_000) ||
      !checkStr(body.statuteText, 50_000) ||
      !checkStr(body.caseText, 100_000) ||
      !checkStr(body.side, 100) ||
      !checkStr(body.level, 50)
    ) {
      return new Response(JSON.stringify({ error: "Input field too large or invalid type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const promptFn = TOOL_PROMPTS[tool];
    if (!promptFn) throw new Error(`Unknown tool: ${tool}`);

    const { system, user } = promptFn(body);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
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
    console.error("student-tools error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

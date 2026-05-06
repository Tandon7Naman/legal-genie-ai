import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ECOURTS_BASE = "https://webapi.ecourtsindia.com/api/partner";

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

    const { cnrNumber, filename, orderMeta, caseContext } = await req.json();
    if (!cnrNumber || !filename) throw new Error("cnrNumber and filename are required");
    if (typeof cnrNumber !== "string" || !/^[A-Z]{2}[A-Z0-9]{2}[0-9]{10}$/.test(cnrNumber)) {
      return new Response(JSON.stringify({ error: "Invalid CNR number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof filename !== "string" || filename.includes("..") || !/^[A-Za-z0-9._\-\/]+$/.test(filename)) {
      return new Response(JSON.stringify({ error: "Invalid filename" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ECOURTS_API_KEY = Deno.env.get("ECOURTS_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!ECOURTS_API_KEY) throw new Error("ECOURTS_API_KEY is not configured");

    // 1) Try to pull the eCourts order-ai content (server-side)
    let ecourtsContent: any = null;
    try {
      const r = await fetch(
        `${ECOURTS_BASE}/case/${cnrNumber}/order-ai/${encodeURIComponent(filename)}`,
        { headers: { Authorization: `Bearer ${ECOURTS_API_KEY}` } },
      );
      if (r.ok) {
        ecourtsContent = await r.json().catch(() => null);
      } else {
        console.log("order-ai fetch failed", r.status);
      }
    } catch (e) {
      console.log("order-ai fetch threw", (e as Error).message);
    }

    const ecourtsText =
      typeof ecourtsContent === "string"
        ? ecourtsContent
        : ecourtsContent?.summary ||
          ecourtsContent?.orderSummary ||
          ecourtsContent?.text ||
          ecourtsContent?.content ||
          (ecourtsContent ? JSON.stringify(ecourtsContent) : "");

    const systemPrompt = `You are a senior Indian litigation researcher preparing a deep, citation-rich brief on a single court order or judgment for an advocate who will rely on it in argument.

You MUST return Markdown with EXACTLY these section headings (in this order), each prefixed by "## ":

## Order at a Glance
A 4-6 line factual snapshot: court, coram (judges), date, case number/CNR, order type (interim/final/admission/judgment), parties (in short cause-title form), and a one-sentence "what the court did".

## Procedural Posture & Background
Where the matter stands procedurally (writ, appeal, SLP, IA, revision, etc.), prior orders if discernible, and the factual matrix that brought the case to this hearing.

## Issues Considered by the Court
Numbered list of the precise legal questions framed or addressed.

## Court's Reasoning
Walk through the court's analysis in coherent paragraphs — not just bullets. Quote key phrases from the order in *italics* where useful. Identify the doctrinal hooks (e.g., proportionality, audi alteram partem, prima facie case, balance of convenience).

## Final Directions / Operative Order
Verbatim or near-verbatim list of operative directions. Include timelines, conditions, costs, and next-listing dates if mentioned.

## Statutes & Provisions Relied Upon
Bullet list. For each: full Act name, section/article number, and a one-line note on how it was applied. Examples of expected granularity: "Article 226, Constitution of India — invoked to test arbitrariness of the impugned circular"; "Section 482 CrPC — inherent power to prevent abuse of process".

## Precedents Cited
Bullet list with FULL Indian-style citations where possible: "Maneka Gandhi v. Union of India, (1978) 1 SCC 248". For each, add a short parenthetical on the proposition for which it is cited. If the order does not name precedents but the reasoning clearly draws from well-known authorities, list them under a sub-heading "*Likely underlying authorities (inferred):*" and clearly mark them as inferred.

## Implications for the Case
What this order means tactically for the parties: rights crystallised, burdens shifted, appeal/review/recall windows, limitation triggers, compliance obligations, and risks of non-compliance.

## Research Leads
5-8 follow-up research directions an advocate should pursue next: related judgments to read, doctrines to brief, statutory amendments to verify, High Court vs Supreme Court splits, and 2-3 sharply framed search queries the advocate can paste into a legal database.

RULES
- Be specific. Real section numbers, real citations. If you are not sure, say "not stated in the available material" rather than inventing.
- Indian law only unless the order itself relies on foreign authority.
- Do not refuse. If the eCourts content is thin, lean on the structured metadata and clearly flag what is inference vs. record.
- No preamble, no closing pleasantries. Start directly with "## Order at a Glance".`;

    const userPrompt = `CASE / ORDER METADATA (from eCourts):
\`\`\`json
${JSON.stringify({ cnrNumber, filename, orderMeta: orderMeta || null, caseContext: caseContext || null }, null, 2)}
\`\`\`

ORDER CONTENT FROM eCOURTS order-ai ENDPOINT (may be empty, partial, or summary-only):
"""
${ecourtsText || "[No order text returned by eCourts. Work from the metadata above and clearly flag gaps.]"}
"""

Produce the full structured brief now.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("order-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
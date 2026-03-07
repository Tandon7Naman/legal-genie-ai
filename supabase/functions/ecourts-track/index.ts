import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cnrNumber } = await req.json();
    if (!cnrNumber) throw new Error("CNR number is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Try to scrape eCourts if Firecrawl is available
    let scrapedData = "";
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (FIRECRAWL_API_KEY) {
      try {
        // Search for the CNR on eCourts-related sites
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `eCourts India CNR ${cnrNumber} case status`,
            limit: 5,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.data && searchData.data.length > 0) {
            scrapedData = searchData.data
              .slice(0, 3)
              .map((r: any) => `Source: ${r.url}\n${r.markdown || r.description || ""}`)
              .join("\n\n---\n\n");
          }
        }
      } catch (e) {
        console.log("Firecrawl search failed, falling back to AI-only:", e);
      }
    }

    const systemPrompt = `You are an Indian eCourts case status expert. The user is querying a CNR (Case Number Record) number.

Your task:
1. Parse the CNR number to identify the court (state code, district code) and case details
2. Provide a structured case status report

Format your response with these sections:
## 📋 CNR Details
- **CNR Number**: [the number]
- **Court**: [identified court from code]
- **State/District**: [decoded from CNR prefix]

## 📊 Case Status
Provide likely status information. If real scraped data is available, use it. Otherwise, explain what each part of the CNR means and guide the user to check ecourts.gov.in manually.

## 🔗 How to Check
Provide step-by-step instructions to check on ecourts.gov.in:
1. Visit https://ecourts.gov.in/ecourts_home/
2. Click "Case Status"
3. Select "CNR Number" search
4. Enter the CNR number

## ⚠️ Disclaimer
Note that this is an AI-assisted lookup. For authoritative case status, always verify on the official eCourts portal.

CNR Code Reference:
- DL = Delhi, MH = Maharashtra, TN = Tamil Nadu, WB = West Bengal, KA = Karnataka, UP = Uttar Pradesh, RJ = Rajasthan, GJ = Gujarat
- HC = High Court, 01-99 = District codes
- SC = Supreme Court

${scrapedData ? `\n\nScraped data from web sources:\n${scrapedData}` : "No live data available. Provide analysis based on the CNR format only."}`;

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
          { role: "user", content: `Track case status for CNR: ${cnrNumber}` },
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
    console.error("ecourts-track error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

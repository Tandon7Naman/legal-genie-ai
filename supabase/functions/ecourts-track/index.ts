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

    const ECOURTS_API_KEY = Deno.env.get("ECOURTS_API_KEY");
    if (!ECOURTS_API_KEY) throw new Error("ECOURTS_API_KEY is not configured");

    const { action, cnrNumber, searchParams } = await req.json();
    const headers = {
      Authorization: `Bearer ${ECOURTS_API_KEY}`,
      "Content-Type": "application/json",
    };

    let result: any;

    switch (action) {
      case "case-detail": {
        if (!cnrNumber) throw new Error("CNR number is required");
        const resp = await fetch(`${ECOURTS_BASE}/case/${cnrNumber}`, { headers });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `eCourts API error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      case "search": {
        const params = new URLSearchParams();
        if (searchParams) {
          for (const [k, v] of Object.entries(searchParams)) {
            if (v !== undefined && v !== null && v !== "") {
              if (Array.isArray(v)) {
                (v as string[]).forEach((val) => params.append(k, val));
              } else {
                params.set(k, String(v));
              }
            }
          }
        }
        const resp = await fetch(`${ECOURTS_BASE}/search?${params}`, { headers });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `Search error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      case "refresh": {
        if (!cnrNumber) throw new Error("CNR number is required");
        const resp = await fetch(`${ECOURTS_BASE}/case/${cnrNumber}/refresh`, {
          method: "POST",
          headers,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `Refresh error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      case "order-ai": {
        if (!cnrNumber || !searchParams?.filename) throw new Error("CNR and filename required");
        const resp = await fetch(
          `${ECOURTS_BASE}/case/${cnrNumber}/order-ai/${searchParams.filename}`,
          { headers }
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `Order AI error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      case "document-proxy": {
        // Streams a PDF from the eCourts API back to the browser using the
        // server-side API key. Used for relative PDF references like
        // "order-1.pdf" returned in judgmentOrders[].orderUrl.
        if (!cnrNumber || !searchParams?.filename) {
          throw new Error("CNR and filename required");
        }
        const filename = String(searchParams.filename).replace(/^\/+/, "");

        // The eCourts Partner API exposes order/judgment PDFs under several
        // possible paths depending on the document type. Try them in order
        // until one succeeds.
        const candidates = filename.startsWith("http")
          ? [filename]
          : [
              `${ECOURTS_BASE}/case/${cnrNumber}/order/${filename}`,
              `${ECOURTS_BASE}/case/${cnrNumber}/judgment/${filename}`,
              `${ECOURTS_BASE}/case/${cnrNumber}/document/${filename}`,
              `${ECOURTS_BASE}/case/${cnrNumber}/file/${filename}`,
            ];

        let resp: Response | null = null;
        let lastStatus = 404;
        let lastBody = "";
        for (const url of candidates) {
          const r = await fetch(url, { headers });
          if (r.ok) { resp = r; break; }
          lastStatus = r.status;
          lastBody = await r.text().catch(() => "");
          console.log(`document-proxy: ${r.status} for ${url}`);
        }

        if (!resp) {
          return new Response(
            JSON.stringify({
              error: `Document not available from eCourts (status ${lastStatus}). ${lastBody.slice(0, 160)}`,
              fallback: true,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const contentType = resp.headers.get("content-type") || "application/pdf";
        const buf = await resp.arrayBuffer();
        return new Response(buf, {
          headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="${filename.split("/").pop()}"`,
            "Cache-Control": "private, max-age=300",
          },
        });
      }

      case "causelist-search": {
        const params = new URLSearchParams();
        if (searchParams) {
          for (const [k, v] of Object.entries(searchParams)) {
            if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
          }
        }
        const resp = await fetch(`${ECOURTS_BASE}/causelist/search?${params}`, { headers });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `Cause list error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      case "court-structure": {
        const path = searchParams?.path || "states";
        const resp = await fetch(`${ECOURTS_BASE}/causelist/court-structure/${path}`, { headers });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `Court structure error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ecourts-track error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ECOURTS_BASE = "https://webapi.ecourtsindia.com/api/partner";

// Real CNRs follow: 2 letters (state), 2 alphanumeric (district), 10 digits (sequence+year)
const CNR_RE = /^[A-Z]{2}[A-Z0-9]{2}[0-9]{10}$/;
// Whitelisted court-structure path segments (no traversal, no arbitrary sub-paths)
const COURT_SEG_RE = /^[A-Za-z0-9_\-]{1,40}$/;
const ALLOWED_SEARCH_KEYS = new Set([
  "cnr","caseType","caseNumber","caseYear","filingNumber","filingYear",
  "partyName","advocateName","stateCode","districtCode","courtComplex",
  "courtCode","page","pageSize","fromDate","toDate","status",
]);
const ALLOWED_CAUSELIST_KEYS = new Set([
  "stateCode","districtCode","courtComplex","courtCode","date",
  "causelistType","page","pageSize",
]);
function pickAllowed(raw: any, allowed: Set<string>) {
  const params = new URLSearchParams();
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      if (!allowed.has(k)) continue;
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        (v as unknown[]).forEach((val) => params.append(k, String(val)));
      } else {
        params.set(k, String(v));
      }
    }
  }
  return params;
}
function validCourtPath(path: string): boolean {
  if (path.includes("..")) return false;
  const segs = path.split("/").filter(Boolean);
  if (segs.length < 1 || segs.length > 3) return false;
  if (segs[0] !== "states") return false;
  return segs.slice(1).every((s) => COURT_SEG_RE.test(s));
}
function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function validCnr(v: unknown): v is string {
  return typeof v === "string" && CNR_RE.test(v);
}

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
        if (!validCnr(cnrNumber)) return badRequest("Invalid CNR number");
        const resp = await fetch(`${ECOURTS_BASE}/case/${cnrNumber}`, { headers });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `eCourts API error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      case "search": {
        const params = pickAllowed(searchParams, ALLOWED_SEARCH_KEYS);
        const resp = await fetch(`${ECOURTS_BASE}/search?${params}`, { headers });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error?.message || `Search error ${resp.status}`);
        }
        result = await resp.json();
        break;
      }

      case "refresh": {
        if (!validCnr(cnrNumber)) return badRequest("Invalid CNR number");
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
        if (!validCnr(cnrNumber) || !searchParams?.filename) return badRequest("Invalid CNR or filename");
        const fnameRaw = String(searchParams.filename);
        if (fnameRaw.includes("..") || !/^[A-Za-z0-9._\-\/]+$/.test(fnameRaw)) {
          return badRequest("Invalid filename");
        }
        const resp = await fetch(
          `${ECOURTS_BASE}/case/${cnrNumber}/order-ai/${fnameRaw}`,
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
        if (!validCnr(cnrNumber) || !searchParams?.filename) {
          return badRequest("Invalid CNR or filename");
        }
        const rawFilename = String(searchParams.filename);
        // Reject absolute URLs to prevent SSRF / API key exfiltration.
        if (/^https?:\/\//i.test(rawFilename)) {
          return new Response(
            JSON.stringify({ error: "Absolute URLs are not allowed" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        // Allow only safe relative filename characters; block path traversal.
        const filename = rawFilename.replace(/^\/+/, "");
        if (filename.includes("..") || !/^[A-Za-z0-9._\-\/]+$/.test(filename)) {
          return new Response(
            JSON.stringify({ error: "Invalid filename" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        const candidates = [
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
        const params = pickAllowed(searchParams, ALLOWED_CAUSELIST_KEYS);
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
        if (typeof path !== "string" || !validCourtPath(path)) {
          return badRequest("Invalid court-structure path");
        }
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

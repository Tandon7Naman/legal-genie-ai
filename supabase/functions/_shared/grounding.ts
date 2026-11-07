// Shared legal-source retrieval with a swappable provider interface.
// Providers return verified snippets that are injected into the AI prompt as context.
// When no provider is configured or retrieval fails, callers report "ai_only".

export interface GroundingSource {
  title: string;
  url: string;
  court?: string;
  snippet: string;
}

export interface GroundingResult {
  status: "verified" | "ai_only";
  provider?: string;
  sources: GroundingSource[];
}

interface Provider {
  name: string;
  enabled(): boolean;
  search(query: string): Promise<GroundingSource[]>;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// Indian Kanoon API (https://api.indiankanoon.org). Activates when INDIAN_KANOON_API_KEY is set.
const indianKanoon: Provider = {
  name: "Indian Kanoon",
  enabled: () => !!Deno.env.get("INDIAN_KANOON_API_KEY"),
  async search(query) {
    const key = Deno.env.get("INDIAN_KANOON_API_KEY")!;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(
        `https://api.indiankanoon.org/search/?formInput=${encodeURIComponent(query.slice(0, 300))}&pagenum=0`,
        { method: "POST", headers: { Authorization: `Token ${key}`, Accept: "application/json" }, signal: ctrl.signal },
      );
      if (!r.ok) {
        console.error("indian kanoon status", r.status);
        return [];
      }
      const data = await r.json();
      const docs = Array.isArray(data?.docs) ? data.docs.slice(0, 5) : [];
      return docs.map((d: any) => ({
        title: stripTags(String(d.title ?? "Untitled")),
        url: `https://indiankanoon.org/doc/${d.tid}/`,
        court: d.docsource ? stripTags(String(d.docsource)) : undefined,
        snippet: stripTags(String(d.headline ?? "")).slice(0, 600),
      }));
    } catch (e) {
      console.error("indian kanoon error", (e as Error).message);
      return [];
    } finally {
      clearTimeout(t);
    }
  },
};

const PROVIDERS: Provider[] = [indianKanoon];

export async function retrieveSources(query: string): Promise<GroundingResult> {
  for (const p of PROVIDERS) {
    if (!p.enabled()) continue;
    const sources = await p.search(query);
    if (sources.length > 0) return { status: "verified", provider: p.name, sources };
  }
  return { status: "ai_only", sources: [] };
}

export function groundingContext(g: GroundingResult): string {
  if (g.status !== "verified") {
    return "\n\nNo verified source documents were retrieved for this query. Answer from general knowledge, and do not invent case names or citations; flag any citation you are unsure of.";
  }
  const list = g.sources
    .map((s, i) => `[${i + 1}] ${s.title}${s.court ? ` (${s.court})` : ""}\n${s.url}\n${s.snippet}`)
    .join("\n\n");
  return `\n\nVerified source documents retrieved from ${g.provider}:\n\n${list}\n\nPrefer these sources. Cite them as [n] with their title. Clearly mark anything not supported by them as general knowledge.`;
}

/** Response header carrying grounding info to the browser (JSON, URL-encoded). */
export function groundingHeader(g: GroundingResult): string {
  return encodeURIComponent(JSON.stringify({
    status: g.status,
    provider: g.provider ?? null,
    sources: g.sources.map((s) => ({ title: s.title, url: s.url, court: s.court ?? null })),
  }));
}

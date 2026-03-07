import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Briefcase, Users, Search, FileText, LayoutDashboard, Settings,
  Scale, History,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<SearchResult[]>([]);
  const [clients, setClients] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  // Search database when query changes
  useEffect(() => {
    if (!user || !open) return;
    const q = query.trim();

    const search = async () => {
      // Cases
      const { data: caseData } = await supabase
        .from("cases")
        .select("id, title, case_number, status")
        .eq("user_id", user.id)
        .or(q ? `title.ilike.%${q}%,case_number.ilike.%${q}%` : "title.neq.$$impossible$$")
        .limit(5);

      setCases(
        (caseData || []).map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: `${c.case_number || "No number"} • ${c.status}`,
          icon: <Briefcase className="h-4 w-4 text-secondary" />,
          action: () => go(`/cases/${c.id}`),
        }))
      );

      // Clients
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("user_id", user.id)
        .or(q ? `name.ilike.%${q}%,email.ilike.%${q}%` : "name.neq.$$impossible$$")
        .limit(5);

      setClients(
        (clientData || []).map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: c.email || "",
          icon: <Users className="h-4 w-4 text-accent" />,
          action: () => go("/clients"),
        }))
      );

      // Research history
      const { data: histData } = await supabase
        .from("search_history")
        .select("id, query_text, query_type")
        .eq("user_id", user.id)
        .ilike("query_text", q ? `%${q}%` : "%")
        .order("created_at", { ascending: false })
        .limit(5);

      setHistory(
        (histData || []).map((h) => ({
          id: h.id,
          title: h.query_text.slice(0, 80),
          subtitle: h.query_type,
          icon: <History className="h-4 w-4 text-muted-foreground" />,
          action: () => go("/research"),
        }))
      );
    };

    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query, user, open, go]);

  const pages: SearchResult[] = [
    { id: "nav-dashboard", title: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, action: () => go("/dashboard") },
    { id: "nav-research", title: "Research", icon: <Search className="h-4 w-4" />, action: () => go("/research") },
    { id: "nav-drafting", title: "Drafting", icon: <FileText className="h-4 w-4" />, action: () => go("/drafting") },
    { id: "nav-cases", title: "Cases", icon: <Briefcase className="h-4 w-4" />, action: () => go("/cases") },
    { id: "nav-clients", title: "Clients", icon: <Users className="h-4 w-4" />, action: () => go("/clients") },
    { id: "nav-ecourts", title: "eCourts Tracker", icon: <Scale className="h-4 w-4" />, action: () => go("/ecourts") },
    { id: "nav-settings", title: "Settings", icon: <Settings className="h-4 w-4" />, action: () => go("/settings") },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/30 bg-card/30 text-muted-foreground text-sm hover:bg-card/60 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/40 bg-muted/50 px-1.5 text-[10px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search cases, clients, research..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Navigation */}
          <CommandGroup heading="Pages">
            {pages.map((p) => (
              <CommandItem key={p.id} onSelect={p.action} className="cursor-pointer">
                {p.icon}
                <span className="ml-2">{p.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {cases.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Cases">
                {cases.map((c) => (
                  <CommandItem key={c.id} onSelect={c.action} className="cursor-pointer">
                    {c.icon}
                    <div className="ml-2 min-w-0">
                      <p className="truncate text-sm">{c.title}</p>
                      {c.subtitle && <p className="text-xs text-muted-foreground truncate">{c.subtitle}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {clients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Clients">
                {clients.map((c) => (
                  <CommandItem key={c.id} onSelect={c.action} className="cursor-pointer">
                    {c.icon}
                    <div className="ml-2 min-w-0">
                      <p className="truncate text-sm">{c.title}</p>
                      {c.subtitle && <p className="text-xs text-muted-foreground truncate">{c.subtitle}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {history.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Research History">
                {history.map((h) => (
                  <CommandItem key={h.id} onSelect={h.action} className="cursor-pointer">
                    {h.icon}
                    <div className="ml-2 min-w-0">
                      <p className="truncate text-sm">{h.title}</p>
                      {h.subtitle && <p className="text-xs text-muted-foreground capitalize truncate">{h.subtitle}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

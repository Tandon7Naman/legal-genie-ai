import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check profile flags
    const { data: profile } = await supabase
      .from("profiles")
      .select("sample_data_seeded, sample_data_cleared")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.sample_data_seeded || profile.sample_data_cleared) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uid = user.id;
    const today = new Date();
    const addDays = (d: number) => {
      const dt = new Date(today); dt.setDate(dt.getDate() + d); return dt.toISOString();
    };
    const addDaysDate = (d: number) => {
      const dt = new Date(today); dt.setDate(dt.getDate() + d); return dt.toISOString().split("T")[0];
    };

    // Clients
    const { data: clients, error: cErr } = await supabase
      .from("clients")
      .insert([
        { user_id: uid, is_sample: true, name: "Sharma Industries Pvt Ltd", email: "legal@sharma-industries.in", phone: "+91 98200 11122", address: "Andheri East, Mumbai", notes: "Manufacturing dispute — sample client" },
        { user_id: uid, is_sample: true, name: "Rajesh Kumar", email: "rajesh.kumar@example.in", phone: "+91 98765 43210", address: "Sector 22, Noida", notes: "Family law matter — sample client" },
        { user_id: uid, is_sample: true, name: "Mehta & Co.", email: "contact@mehtaco.in", phone: "+91 99999 88877", address: "Connaught Place, New Delhi", notes: "Corporate retainer — sample client" },
      ])
      .select("id, name");
    if (cErr) throw cErr;

    const [c1, c2, c3] = clients!;

    // Cases
    const { data: cases, error: caseErr } = await supabase
      .from("cases")
      .insert([
        { user_id: uid, is_sample: true, client_id: c1.id, title: "Sharma Industries v. Apex Logistics", case_number: "COM/2456/2024", court: "Bombay High Court", judge: "Hon'ble Justice A. Sharma", practice_area: "corporate", status: "active", description: "Breach of contract — logistics services. Sample case.", next_hearing_date: addDaysDate(7) },
        { user_id: uid, is_sample: true, client_id: c2.id, title: "Kumar v. Kumar (Maintenance)", case_number: "MAT/0987/2024", court: "Family Court, Saket", judge: "Hon'ble Judge R. Verma", practice_area: "family", status: "active", description: "Section 125 CrPC maintenance petition. Sample case.", next_hearing_date: addDaysDate(14) },
        { user_id: uid, is_sample: true, client_id: c3.id, title: "Mehta & Co. — IPR Advisory", case_number: "IPR/0042/2024", court: "Delhi High Court", judge: "Hon'ble Justice P. Singh", practice_area: "corporate", status: "active", description: "Trademark infringement matter. Sample case.", next_hearing_date: addDaysDate(21) },
      ])
      .select("id, title");
    if (caseErr) throw caseErr;

    const [k1, k2, k3] = cases!;

    // Tasks
    await supabase.from("tasks").insert([
      { user_id: uid, is_sample: true, case_id: k1.id, title: "Draft reply to summons", due_date: addDaysDate(2), completed: false },
      { user_id: uid, is_sample: true, case_id: k1.id, title: "Collect logistics invoices from client", due_date: addDaysDate(5), completed: false },
      { user_id: uid, is_sample: true, case_id: k2.id, title: "File interim maintenance application", due_date: addDaysDate(10), completed: false },
      { user_id: uid, is_sample: true, case_id: k3.id, title: "Send IPR opinion letter", due_date: addDaysDate(15), completed: false },
    ]);

    // Calendar events
    await supabase.from("calendar_events").insert([
      { user_id: uid, is_sample: true, case_id: k1.id, title: "Hearing — Sharma Industries v. Apex", date: addDays(7), type: "hearing", location: "Bombay High Court, Court Room 22" },
      { user_id: uid, is_sample: true, case_id: k2.id, title: "Client meeting — Rajesh Kumar", date: addDays(3), type: "meeting", location: "Office" },
    ]);

    // Saved drafts
    await supabase.from("saved_drafts").insert([
      { user_id: uid, is_sample: true, title: "Legal Notice — Recovery of Dues", document_type: "legal_notice", content: "# Legal Notice\n\nUnder instructions from my client, Sharma Industries Pvt Ltd, I hereby serve this legal notice...\n\n*Sample draft — feel free to edit or delete.*", status: "draft" },
      { user_id: uid, is_sample: true, title: "Service Agreement — Mehta & Co.", document_type: "contract", content: "# Service Agreement\n\nThis Service Agreement is entered into as of [DATE] between Mehta & Co. (\"Client\") and [Counsel].\n\n*Sample draft — feel free to edit or delete.*", status: "draft" },
    ]);

    // Invoice
    await supabase.from("invoices").insert([
      { user_id: uid, is_sample: true, client_id: c1.id, case_id: k1.id, invoice_number: "INV-SAMPLE-001", amount: 25000, status: "draft", due_date: addDaysDate(30), description: "Drafting and pleadings — sample invoice" },
    ]);

    // Billable hours
    await supabase.from("billable_hours").insert([
      { user_id: uid, is_sample: true, client_id: c1.id, case_id: k1.id, hours: 3.5, rate: 5000, description: "Initial consultation and case review (sample)", date: addDaysDate(-2) },
    ]);

    // Search history
    await supabase.from("search_history").insert([
      { user_id: uid, is_sample: true, query_text: "Section 138 NI Act recent judgments", query_type: "search", filters: { subjectArea: "criminal" } },
      { user_id: uid, is_sample: true, query_text: "Specific Relief Act amendment 2018 commercial contracts", query_type: "search", filters: { subjectArea: "civil" } },
    ]);

    // Mark seeded
    await supabase.from("profiles").update({ sample_data_seeded: true }).eq("user_id", uid);

    return new Response(JSON.stringify({ ok: true, seeded: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-sample-data error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
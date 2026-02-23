import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Plus, Loader2, FileText, CheckSquare, MessageSquare, Upload, Trash2, Download } from "lucide-react";

type CaseStatus = "active" | "pending" | "closed" | "won" | "lost" | "settled";

interface CaseData {
  id: string;
  title: string;
  case_number: string | null;
  court: string | null;
  judge: string | null;
  status: CaseStatus;
  practice_area: string | null;
  description: string | null;
  next_hearing_date: string | null;
  created_at: string;
}

interface Hearing {
  id: string;
  date: string;
  court: string | null;
  judge: string | null;
  purpose: string | null;
  notes: string | null;
  outcome: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
}

interface CaseNote {
  id: string;
  content: string;
  created_at: string;
}

const statusColors: Record<CaseStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  won: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
  settled: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [documents, setDocuments] = useState<{ name: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newHearing, setNewHearing] = useState({ date: "", court: "", purpose: "" });
  const [newTask, setNewTask] = useState({ title: "", due_date: "" });
  const [newNote, setNewNote] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    const [caseRes, hearingsRes, tasksRes, notesRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", id).single(),
      supabase.from("hearings").select("*").eq("case_id", id).order("date", { ascending: true }),
      supabase.from("tasks").select("*").eq("case_id", id).order("created_at", { ascending: false }),
      supabase.from("case_notes").select("*").eq("case_id", id).order("created_at", { ascending: false }),
    ]);
    if (caseRes.data) setCaseData(caseRes.data as CaseData);
    if (hearingsRes.data) setHearings(hearingsRes.data as Hearing[]);
    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (notesRes.data) setNotes(notesRes.data as CaseNote[]);

    // Load documents from storage
    if (user) {
      const { data: files } = await supabase.storage.from("case-documents").list(`${user.id}/${id}`);
      if (files) setDocuments(files.map(f => ({ name: f.name, created_at: f.created_at })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const updateStatus = async (status: CaseStatus) => {
    if (!id) return;
    await supabase.from("cases").update({ status }).eq("id", id);
    setCaseData(prev => prev ? { ...prev, status } : null);
    toast({ title: `Status updated to ${status}` });
  };

  const addHearing = async () => {
    if (!newHearing.date || !user || !id) return;
    const { error } = await supabase.from("hearings").insert({
      case_id: id, user_id: user.id, date: newHearing.date,
      court: newHearing.court || null, purpose: newHearing.purpose || null,
    });
    if (!error) {
      setNewHearing({ date: "", court: "", purpose: "" });
      fetchAll();
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !user || !id) return;
    const { error } = await supabase.from("tasks").insert({
      case_id: id, user_id: user.id, title: newTask.title,
      due_date: newTask.due_date || null,
    });
    if (!error) {
      setNewTask({ title: "", due_date: "" });
      fetchAll();
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !completed } : t));
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addNote = async () => {
    if (!newNote.trim() || !user || !id) return;
    const { error } = await supabase.from("case_notes").insert({
      case_id: id, user_id: user.id, content: newNote,
    });
    if (!error) {
      setNewNote("");
      fetchAll();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !id) return;
    setUploading(true);
    const path = `${user.id}/${id}/${file.name}`;
    const { error } = await supabase.storage.from("case-documents").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "File uploaded" });
      fetchAll();
    }
    setUploading(false);
  };

  const downloadFile = async (fileName: string) => {
    if (!user || !id) return;
    const { data } = await supabase.storage.from("case-documents").download(`${user.id}/${id}/${fileName}`);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Case not found</p>
        <Button variant="ghost" onClick={() => navigate("/cases")} className="text-secondary">Go back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <header className="border-b border-border/20 bg-primary/50 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cases")} className="text-primary-foreground/60 hover:text-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to="/" className="font-serif text-xl font-bold text-primary-foreground">
              Tandon <span className="text-gradient-gold">Associates</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Case header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold text-primary-foreground mb-2">{caseData.title}</h1>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {caseData.case_number && <span>#{caseData.case_number}</span>}
                {caseData.court && <span>• {caseData.court}</span>}
                {caseData.judge && <span>• Judge: {caseData.judge}</span>}
                {caseData.practice_area && <span>• {caseData.practice_area}</span>}
              </div>
              {caseData.description && <p className="text-sm text-muted-foreground mt-2">{caseData.description}</p>}
            </div>
            <Select value={caseData.status} onValueChange={(v) => updateStatus(v as CaseStatus)}>
              <SelectTrigger className="w-36 bg-primary/20 border-border/30">
                <Badge variant="outline" className={`text-xs ${statusColors[caseData.status]}`}>{caseData.status}</Badge>
              </SelectTrigger>
              <SelectContent>
                {(["active", "pending", "closed", "won", "lost", "settled"] as CaseStatus[]).map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="hearings">
            <TabsList className="bg-primary/30 border border-border/20 mb-6">
              <TabsTrigger value="hearings" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <Calendar className="w-4 h-4 mr-2" /> Hearings
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <CheckSquare className="w-4 h-4 mr-2" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <MessageSquare className="w-4 h-4 mr-2" /> Notes
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <FileText className="w-4 h-4 mr-2" /> Docs
              </TabsTrigger>
            </TabsList>

            {/* Hearings */}
            <TabsContent value="hearings" className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Date & Time</Label>
                  <Input type="datetime-local" value={newHearing.date} onChange={(e) => setNewHearing({ ...newHearing, date: e.target.value })} className="bg-primary/20 border-border/30 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Purpose</Label>
                  <Input value={newHearing.purpose} onChange={(e) => setNewHearing({ ...newHearing, purpose: e.target.value })} placeholder="e.g. Arguments" className="bg-primary/20 border-border/30 text-primary-foreground" />
                </div>
                <Button size="sm" onClick={addHearing} disabled={!newHearing.date} className="bg-secondary text-secondary-foreground hover:bg-accent">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {hearings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hearings scheduled</p>
              ) : (
                hearings.map((h) => (
                  <div key={h.id} className="p-4 rounded-lg bg-primary/20 border border-border/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-primary-foreground">{new Date(h.date).toLocaleString()}</span>
                        {h.purpose && <span className="text-sm text-muted-foreground ml-3">{h.purpose}</span>}
                      </div>
                      {h.outcome && <Badge variant="outline" className="text-xs">{h.outcome}</Badge>}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Task</Label>
                  <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="New task..." onKeyDown={(e) => e.key === "Enter" && addTask()} className="bg-primary/20 border-border/30 text-primary-foreground" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due</Label>
                  <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="bg-primary/20 border-border/30 text-primary-foreground" />
                </div>
                <Button size="sm" onClick={addTask} disabled={!newTask.title.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tasks yet</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/20 border border-border/20">
                    <Checkbox checked={t.completed} onCheckedChange={() => toggleTask(t.id, t.completed)} />
                    <span className={`flex-1 text-sm ${t.completed ? "line-through text-muted-foreground" : "text-primary-foreground"}`}>{t.title}</span>
                    {t.due_date && <span className="text-xs text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</span>}
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="space-y-4">
              <div className="flex gap-2">
                <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." rows={2} className="bg-primary/20 border-border/30 text-primary-foreground flex-1" />
                <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="bg-secondary text-secondary-foreground hover:bg-accent self-end">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {notes.map((n) => (
                <div key={n.id} className="p-4 rounded-lg bg-primary/20 border border-border/20">
                  <p className="text-sm text-primary-foreground whitespace-pre-wrap">{n.content}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-4">
              <label className="flex items-center gap-2 p-4 rounded-lg border-2 border-dashed border-border/30 hover:border-secondary/30 transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload a document"}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No documents uploaded</p>
              ) : (
                documents.map((d) => (
                  <button key={d.name} onClick={() => downloadFile(d.name)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/20 border border-border/20 hover:border-secondary/30 transition-colors text-left">
                    <FileText className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-primary-foreground flex-1 truncate">{d.name}</span>
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default CaseDetailPage;

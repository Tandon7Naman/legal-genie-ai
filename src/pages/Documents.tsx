import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Search, Trash2, Download, File, Image, FileSpreadsheet } from "lucide-react";

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-destructive" />,
  doc: <FileText className="w-5 h-5 text-blue-400" />,
  docx: <FileText className="w-5 h-5 text-blue-400" />,
  xls: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
  xlsx: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
  png: <Image className="w-5 h-5 text-purple-400" />,
  jpg: <Image className="w-5 h-5 text-purple-400" />,
};

const Documents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchDocs = async () => {
    if (!user) return;
    const { data } = await supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setDocs(data);
  };

  useEffect(() => { fetchDocs(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("case-documents").upload(filePath, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() || "";
    await supabase.from("documents").insert({
      user_id: user.id, title: file.name, file_path: filePath,
      file_type: ext, file_size: file.size,
    });

    toast({ title: "Document uploaded" });
    setUploading(false);
    fetchDocs();
  };

  const handleDelete = async (doc: any) => {
    if (doc.file_path) await supabase.storage.from("case-documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    toast({ title: "Document deleted" });
    fetchDocs();
  };

  const handleDownload = async (doc: any) => {
    if (!doc.file_path) return;
    const { data } = await supabase.storage.from("case-documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = docs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload, manage, and organize your legal documents.</p>
        </div>
        <Button className="gap-1.5 relative" disabled={uploading}>
          <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload"}
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={uploading} />
        </Button>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map((doc) => (
          <Card key={doc.id} className="border-border/30 group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted/50">
                {FILE_ICONS[doc.file_type] || <File className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatSize(doc.file_size)}</span>
                  <span>v{doc.version}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}><Download className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(doc)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{search ? "No documents match your search." : "No documents uploaded yet."}</p>
        </div>
      )}
    </div>
  );
};

export default Documents;

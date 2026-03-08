import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Users, Copy, Check, Link2, Wifi, WifiOff, Circle } from "lucide-react";

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
}

interface Presence {
  id: string;
  name: string;
  color: string;
  cursor?: number;
}

const COLORS = ["#c9a84c", "#4ecdc4", "#ff6b6b", "#a855f7", "#22c55e", "#f59e0b"];

export function CollaborativeEditor({ documentId, initialContent = "" }: CollaborativeEditorProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [peers, setPeers] = useState<Presence[]>([]);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const myColor = COLORS[Math.abs(user?.id?.charCodeAt(0) || 0) % COLORS.length];
  const myName = profile?.full_name || user?.email || "Anonymous";

  useEffect(() => {
    const channel = supabase.channel(`collab:${documentId}`, {
      config: { presence: { key: user?.id || "anon" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: Presence[] = [];
        Object.entries(state).forEach(([key, presences]) => {
          if (key !== user?.id) {
            const p = (presences as any)[0];
            users.push({ id: key, name: p.name || "Anonymous", color: p.color || "#888", cursor: p.cursor });
          }
        });
        setPeers(users);
      })
      .on("broadcast", { event: "content_update" }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setContent(payload.content);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({
            name: myName,
            color: myColor,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [documentId, user?.id, myName, myColor]);

  const broadcastContent = useCallback(
    (newContent: string) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "content_update",
          payload: { content: newContent, userId: user?.id },
        });
      }
    },
    [user?.id]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => broadcastContent(newContent), 150);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/drafting?collab=${documentId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Collaboration link copied!" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Collaboration Header */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">
              {connected ? "Live" : "Connecting..."}
            </span>
          </div>

          {/* Online Users */}
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex -space-x-1.5">
              {/* Self */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-background border-2 border-background"
                style={{ backgroundColor: myColor }}
                title={`${myName} (you)`}
              >
                {myName[0]?.toUpperCase()}
              </div>
              {/* Peers */}
              {peers.map((p) => (
                <div
                  key={p.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-background border-2 border-background"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {p.name[0]?.toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">
              {peers.length + 1} online
            </span>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleCopyLink} className="text-xs text-muted-foreground hover:text-secondary">
          {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Link2 className="w-3.5 h-3.5 mr-1" />}
          {copied ? "Copied!" : "Share Link"}
        </Button>
      </div>

      {/* Editor */}
      <Textarea
        value={content}
        onChange={handleChange}
        placeholder="Start typing... Changes are synced in real-time with collaborators."
        rows={16}
        className="bg-card/50 border-border/30 font-mono text-sm placeholder:text-muted-foreground/50 resize-y"
      />

      {/* Peer cursors indicator */}
      {peers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {peers.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <Circle className="w-2 h-2 fill-current" style={{ color: p.color }} />
              <span>{p.name}</span>
            </div>
          ))}
          <span>editing</span>
        </div>
      )}
    </motion.div>
  );
}

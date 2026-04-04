import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Gavel, AlertCircle,
} from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, eachDayOfInterval, isToday,
} from "date-fns";

interface CalEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  type: string;
  location: string | null;
  description: string | null;
  case_id: string | null;
}

interface Hearing {
  id: string;
  date: string;
  purpose: string | null;
  court: string | null;
  case_id: string;
}

const TYPE_COLORS: Record<string, string> = {
  hearing: "bg-amber-500",
  meeting: "bg-blue-500",
  deadline: "bg-destructive",
  filing: "bg-emerald-500",
};

const CalendarPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: format(new Date(), "yyyy-MM-dd"), time: "10:00", type: "meeting", location: "", description: "" });

  const fetchData = async () => {
    if (!user) return;
    const [evRes, hRes] = await Promise.all([
      supabase.from("calendar_events").select("*").eq("user_id", user.id),
      supabase.from("hearings").select("*").eq("user_id", user.id),
    ]);
    if (evRes.data) setEvents(evRes.data);
    if (hRes.data) setHearings(hRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.title) return;
    const dateStr = `${form.date}T${form.time}:00`;
    await supabase.from("calendar_events").insert({ user_id: user.id, title: form.title, date: dateStr, type: form.type, location: form.location || null, description: form.description || null });
    toast({ title: "Event created" });
    setOpen(false);
    setForm({ title: "", date: format(new Date(), "yyyy-MM-dd"), time: "10:00", type: "meeting", location: "", description: "" });
    fetchData();
  };

  // Merge events + hearings into unified items
  const allItems = useMemo(() => {
    const items: { id: string; title: string; date: Date; type: string; detail?: string }[] = [];
    events.forEach((e) => items.push({ id: e.id, title: e.title, date: new Date(e.date), type: e.type, detail: e.location || undefined }));
    hearings.forEach((h) => items.push({ id: h.id, title: h.purpose || "Hearing", date: new Date(h.date), type: "hearing", detail: h.court || undefined }));
    return items;
  }, [events, hearings]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const selectedItems = allItems.filter((i) => isSameDay(i.date, selectedDate));

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Hearings, deadlines, and events at a glance.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1.5"><Plus className="w-4 h-4" /> New Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hearing">Hearing</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="filing">Filing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">Save Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Calendar Grid */}
        <Card className="border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <h2 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-px">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {days.map((day) => {
                const dayItems = allItems.filter((i) => isSameDay(i.date, day));
                const selected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-2 min-h-[60px] text-left text-sm rounded-lg transition-colors ${
                      !isSameMonth(day, currentMonth) ? "text-muted-foreground/40" : ""
                    } ${selected ? "bg-secondary/20 ring-1 ring-secondary" : "hover:bg-muted/50"} ${
                      isToday(day) ? "font-bold text-secondary" : ""
                    }`}
                  >
                    {format(day, "d")}
                    {dayItems.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {dayItems.slice(0, 3).map((i) => (
                          <div key={i.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[i.type] || "bg-muted-foreground"}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day events */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">{format(selectedDate, "EEEE, MMMM d")}</h3>
          <AnimatePresence mode="popLayout">
            {selectedItems.length === 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground py-4">No events on this day.</motion.p>
            )}
            {selectedItems.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <Card className="border-border/30">
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[item.type] || "bg-muted-foreground"}`} />
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(item.date, "h:mm a")}</span>
                      {item.detail && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.detail}</span>}
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

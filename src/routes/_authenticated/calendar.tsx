import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar as CalendarIcon, Phone, Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { t, lang } = useI18n();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "meeting", starts_at: "", ends_at: "" });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").gte("starts_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("starts_at");
      if (error) throw error;
      return data;
    },
  });

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const todayEvents = (events ?? []).filter((e) => e.starts_at >= startToday && e.starts_at < endToday);
  const upcoming = (events ?? []).filter((e) => e.starts_at >= endToday);

  const submit = async () => {
    if (!form.title.trim() || !form.starts_at) return toast.error(t("event_title"));
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      type: form.type as any,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      assigned_to: user?.id,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    setOpen(false);
    setForm({ title: "", description: "", type: "meeting", starts_at: "", ends_at: "" });
    qc.invalidateQueries({ queryKey: ["events"] });
  };

  const remove = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    await supabase.from("events").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["events"] });
  };

  const icon = { meeting: CalendarIcon, call: Phone, reminder: Bell };

  const renderItem = (e: any) => {
    const Icon = icon[e.type as keyof typeof icon] || CalendarIcon;
    return (
      <Card key={e.id} className="glass-card p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{e.title}</div>
          <div className="text-sm text-muted-foreground">
            {new Date(e.starts_at).toLocaleString(lang === "kg" ? "ky-KG" : "ru-RU", { dateStyle: "medium", timeStyle: "short" })}
          </div>
          {e.description && <p className="text-sm mt-1 text-muted-foreground line-clamp-2">{e.description}</p>}
        </div>
        {(role === "admin" || e.created_by === user?.id) && (
          <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t("calendar_title")}</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t("new_event")}
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">{t("today")}</h2>
        {todayEvents.length === 0 ? (
          <Card className="glass-card p-6 text-center text-muted-foreground text-sm">{t("empty")}</Card>
        ) : (
          <div className="space-y-2">{todayEvents.map(renderItem)}</div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <Card className="glass-card p-6 text-center text-muted-foreground text-sm">{t("empty")}</Card>
        ) : (
          <div className="space-y-2">{upcoming.map(renderItem)}</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("new_event")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("event_title")} *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>{t("event_type")}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">{t("type_meeting")}</SelectItem>
                  <SelectItem value="call">{t("type_call")}</SelectItem>
                  <SelectItem value="reminder">{t("type_reminder")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("starts_at")} *</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><Label>{t("ends_at")}</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>
            <div><Label>{t("description")}</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button onClick={submit}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

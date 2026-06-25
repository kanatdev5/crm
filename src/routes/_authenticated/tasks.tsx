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
import { Plus, Trash2, CalendarClock, Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

const STATUSES = ["todo", "in_progress", "done", "cancelled"] as const;

function TasksPage() {
  const { t, lang } = useI18n();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", priority: "medium" });
  const [filter, setFilter] = useState<"all" | typeof STATUSES[number]>("all");

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (tasks ?? []).filter((t) => filter === "all" || t.status === filter);

  const submit = async () => {
    if (!form.title.trim()) return toast.error(t("task_title"));
    const { error } = await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      priority: form.priority as any,
      assigned_to: user?.id,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    setOpen(false);
    setForm({ title: "", description: "", due_date: "", priority: "medium" });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tasks").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const remove = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    await supabase.from("tasks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const priColor = { low: "text-muted-foreground", medium: "text-warning", high: "text-destructive" } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t("tasks_title")}</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t("new_task")}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
          {lang === "kg" ? "Баары" : "Все"}
        </FilterPill>
        {STATUSES.map((s) => (
          <FilterPill key={s} active={filter === s} onClick={() => setFilter(s)}>
            {t(`task_${s}` as any)}
          </FilterPill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="glass-card p-12 text-center text-muted-foreground">{t("empty")}</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <Card key={task.id} className="glass-card p-4 flex items-center gap-4">
              <Flag className={`h-4 w-4 shrink-0 ${priColor[task.priority as keyof typeof priColor]}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{task.title}</div>
                {task.description && <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>}
                {task.due_date && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <CalendarClock className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleString(lang === "kg" ? "ky-KG" : "ru-RU")}
                  </div>
                )}
              </div>
              <Select value={task.status} onValueChange={(v) => updateStatus(task.id, v)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`task_${s}` as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(role === "admin" || role === "manager" || task.created_by === user?.id) && (
                <button onClick={() => remove(task.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("new_task")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("task_title")} *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>{t("description")}</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("due_date")}</Label><Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div>
                <Label>{t("priority")}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("priority_low")}</SelectItem>
                    <SelectItem value="medium">{t("priority_medium")}</SelectItem>
                    <SelectItem value="high">{t("priority_high")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

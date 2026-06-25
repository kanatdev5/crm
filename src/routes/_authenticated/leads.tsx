import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from "@dnd-kit/core";

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});

const STATUSES = ["new", "contacted", "negotiation", "won", "lost"] as const;
type Status = (typeof STATUSES)[number];

interface Lead {
  id: string;
  title: string;
  status: Status;
  amount: number | null;
  source: string | null;
  notes: string | null;
  client_id: string | null;
}

function LeadsPage() {
  const { t, lang } = useI18n();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", source: "", notes: "", client_id: "" });
  const canManage = role === "admin" || role === "manager";

  const { data: leads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("position");
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name").order("name");
      return data ?? [];
    },
  });

  const grouped = useMemo(() => {
    const g: Record<Status, Lead[]> = { new: [], contacted: [], negotiation: [], won: [], lost: [] };
    (leads ?? []).forEach((l) => g[l.status].push(l));
    return g;
  }, [leads]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    const id = String(e.active.id);
    const newStatus = e.over?.id as Status | undefined;
    if (!newStatus || !STATUSES.includes(newStatus)) return;
    const lead = leads?.find((l) => l.id === id);
    if (!lead || lead.status === newStatus) return;
    qc.setQueryData<Lead[]>(["leads"], (old) =>
      old?.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["leads"] });
    }
  };

  const submit = async () => {
    if (!form.title.trim()) return toast.error(t("lead_title"));
    const { error } = await supabase.from("leads").insert({
      title: form.title,
      amount: Number(form.amount) || 0,
      source: form.source || null,
      notes: form.notes || null,
      client_id: form.client_id || null,
      assigned_to: user?.id,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    setOpen(false);
    setForm({ title: "", amount: "", source: "", notes: "", client_id: "" });
    qc.invalidateQueries({ queryKey: ["leads"] });
  };

  const remove = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["leads"] });
  };

  const fmt = new Intl.NumberFormat(lang === "kg" ? "ky-KG" : "ru-RU");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t("leads_title")}</h1>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t("new_lead")}
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATUSES.map((s) => {
            const total = grouped[s].reduce((a, b) => a + Number(b.amount ?? 0), 0);
            return (
              <Column key={s} status={s} count={grouped[s].length} total={fmt.format(total)}>
                {grouped[s].map((l) => (
                  <LeadCard key={l.id} lead={l} canManage={canManage} onDelete={() => remove(l.id)} />
                ))}
              </Column>
            );
          })}
        </div>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("new_lead")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("lead_title")} *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("amount")}</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>{t("source")}</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
            </div>
            <div>
              <Label>{t("client")}</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("notes")}</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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

function Column({ status, count, total, children }: { status: Status; count: number; total: string; children: React.ReactNode }) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const colorMap: Record<Status, string> = {
    new: "border-t-chart-1",
    contacted: "border-t-chart-3",
    negotiation: "border-t-chart-4",
    won: "border-t-success",
    lost: "border-t-destructive",
  };
  return (
    <div ref={setNodeRef} className={`glass-card rounded-xl p-3 border-t-2 ${colorMap[status]} transition ${isOver ? "ring-2 ring-primary/50" : ""}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="font-semibold text-sm">{t(`status_${status}` as any)}</h3>
          <p className="text-xs text-muted-foreground">{count} · {total}</p>
        </div>
      </div>
      <div className="space-y-2 min-h-[120px]">{children}</div>
    </div>
  );
}

function LeadCard({ lead, canManage, onDelete }: { lead: Lead; canManage: boolean; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-grab active:cursor-grabbing bg-card hover:ring-1 hover:ring-primary/40 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm flex-1 min-w-0">{lead.title}</h4>
        {canManage && (
          <button onPointerDown={(e) => e.stopPropagation()} onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {lead.amount && Number(lead.amount) > 0 && (
        <div className="text-xs text-accent font-semibold mt-2">{Number(lead.amount).toLocaleString()}</div>
      )}
      {lead.source && <div className="text-xs text-muted-foreground mt-1">{lead.source}</div>}
    </Card>
  );
}

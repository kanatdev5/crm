import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Users, Target, CheckSquare, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [clients, leads, tasks, won] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["new", "contacted", "negotiation"]),
        supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["todo", "in_progress"]),
        supabase.from("leads").select("amount").eq("status", "won"),
      ]);
      const wonSum = (won.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
      return {
        clients: clients.count ?? 0,
        leads: leads.count ?? 0,
        tasks: tasks.count ?? 0,
        won: wonSum,
      };
    },
  });

  const { data: recentLeads } = useQuery({
    queryKey: ["recent-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, title, status, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const stats = [
    { label: t("total_clients"), value: data?.clients ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/30" },
    { label: t("active_leads"), value: data?.leads ?? 0, icon: Target, color: "text-accent", bg: "bg-accent/10", ring: "ring-accent/30" },
    { label: t("open_tasks"), value: data?.tasks ?? 0, icon: CheckSquare, color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/30" },
    { label: t("won_amount"), value: new Intl.NumberFormat(lang === "kg" ? "ky-KG" : "ru-RU").format(data?.won ?? 0), icon: TrendingUp, color: "text-success", bg: "bg-success/10", ring: "ring-success/30" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("welcome")}, {user?.email?.split("@")[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">{new Date().toLocaleDateString(lang === "kg" ? "ky-KG" : "ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-bold mt-2 font-display">{s.value}</div>
                </div>
                <div className={`h-10 w-10 rounded-xl ${s.bg} ring-1 ${s.ring} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4">{t("recent_activity")}</h2>
        {recentLeads && recentLeads.length > 0 ? (
          <div className="divide-y divide-border">
            {recentLeads.map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString(lang === "kg" ? "ky-KG" : "ru-RU")}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{Number(l.amount ?? 0).toLocaleString()}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">{t(`status_${l.status}` as any)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        )}
      </Card>
    </div>
  );
}

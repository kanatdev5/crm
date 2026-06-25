import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { t, lang } = useI18n();
  const fmt = new Intl.NumberFormat(lang === "kg" ? "ky-KG" : "ru-RU");

  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [leads, clients] = await Promise.all([
        supabase.from("leads").select("status, amount, created_at"),
        supabase.from("clients").select("id, created_at"),
      ]);
      return { leads: leads.data ?? [], clients: clients.data ?? [] };
    },
  });

  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const newClientsMonth = (data?.clients ?? []).filter((c) => c.created_at >= monthAgo).length;

  const byStatus = ["new", "contacted", "negotiation", "won", "lost"].map((s) => ({
    status: t(`status_${s}` as any),
    count: (data?.leads ?? []).filter((l) => l.status === s).length,
    amount: (data?.leads ?? []).filter((l) => l.status === s).reduce((a, b) => a + Number(b.amount ?? 0), 0),
  }));

  const total = (data?.leads ?? []).length;
  const won = (data?.leads ?? []).filter((l) => l.status === "won").length;
  const lost = (data?.leads ?? []).filter((l) => l.status === "lost").length;
  const closed = won + lost;
  const conversion = closed > 0 ? Math.round((won / closed) * 100) : 0;

  const totalWon = (data?.leads ?? []).filter((l) => l.status === "won").reduce((a, b) => a + Number(b.amount ?? 0), 0);

  const colors = ["oklch(0.65 0.18 255)", "oklch(0.78 0.16 75)", "oklch(0.65 0.2 320)", "oklch(0.72 0.17 165)", "oklch(0.62 0.22 25)"];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("reports_title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox label={t("conversion_rate")} value={`${conversion}%`} />
        <StatBox label={t("won_amount")} value={fmt.format(totalWon)} />
        <StatBox label={t("new_clients_month")} value={String(newClientsMonth)} />
        <StatBox label={t("active_leads")} value={String(total - closed)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-6">
          <h2 className="font-semibold mb-4">{t("by_status")}</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byStatus}>
                <XAxis dataKey="status" stroke="oklch(0.7 0.02 255)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 255)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.23 0.03 260)", border: "1px solid oklch(0.3 0.025 260)", borderRadius: "8px" }} />
                <Bar dataKey="count" fill="oklch(0.65 0.18 255)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <h2 className="font-semibold mb-4">{t("by_status")} ({t("amount")})</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus.filter((s) => s.amount > 0)} dataKey="amount" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {byStatus.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.23 0.03 260)", border: "1px solid oklch(0.3 0.025 260)", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card className="glass-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold font-display mt-2">{value}</div>
    </Card>
  );
}

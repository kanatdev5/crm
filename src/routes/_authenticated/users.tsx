import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

type Role = "admin" | "manager" | "employee";

function UsersPage() {
  const { t } = useI18n();
  const { role } = useAuth();
  const qc = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, created_at").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      const rolesMap = new Map<string, Role>();
      (roles.data ?? []).forEach((r) => rolesMap.set(r.user_id, r.role as Role));
      return (profiles.data ?? []).map((p) => ({ ...p, role: rolesMap.get(p.id) ?? "employee" }));
    },
    enabled: role === "admin",
  });

  if (role !== "admin") {
    return (
      <Card className="glass-card p-12 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{t("admin_only")}</p>
      </Card>
    );
  }

  const changeRole = async (uid: string, newRole: Role) => {
    // delete existing roles, insert new
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", uid);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("✓");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("users_title")}</h1>

      {isLoading ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : (
        <Card className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sidebar-accent">
              <tr>
                <th className="text-left p-3 font-medium">{t("email")}</th>
                <th className="text-left p-3 font-medium">{t("full_name")}</th>
                <th className="text-left p-3 font-medium">{t("role")}</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-muted-foreground">{u.full_name}</td>
                  <td className="p-3">
                    <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as Role)}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t("role_admin")}</SelectItem>
                        <SelectItem value="manager">{t("role_manager")}</SelectItem>
                        <SelectItem value="employee">{t("role_employee")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

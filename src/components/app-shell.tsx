import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  Calendar,
  BarChart3,
  UserCog,
  LogOut,
  Sparkles,
  Menu,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ children }: { children: ReactNode }) {
  const { role, user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const navItems = [
    { to: "/dashboard", label: t("nav_dashboard"), icon: LayoutDashboard },
    { to: "/clients", label: t("nav_clients"), icon: Users },
    { to: "/leads", label: t("nav_leads"), icon: Target },
    { to: "/tasks", label: t("nav_tasks"), icon: CheckSquare },
    { to: "/calendar", label: t("nav_calendar"), icon: Calendar },
    { to: "/reports", label: t("nav_reports"), icon: BarChart3 },
    ...(role === "admin" ? [{ to: "/users", label: t("nav_users"), icon: UserCog }] : []),
  ];

  // Bottom-bar shows the 5 most-used items on mobile
  const bottomItems = navItems.slice(0, 5);

  const SidebarBody = (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-sidebar-foreground truncate">{t("app_name")}</div>
            <div className="text-xs text-muted-foreground">CRM</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = loc.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-3">
        <div className="flex gap-1 bg-sidebar-accent rounded-lg p-1">
          {(["kg", "ru"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition ${
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="px-3 py-2 rounded-lg bg-sidebar-accent">
          <div className="text-sm font-medium truncate text-sidebar-foreground">{user?.email}</div>
          <div className="text-xs text-primary capitalize">{role && t(`role_${role}` as any)}</div>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
        >
          <LogOut className="h-4 w-4" />
          {t("sign_out")}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gradient-radial">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col shrink-0">
        {SidebarBody}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 bg-sidebar/95 backdrop-blur border-b border-sidebar-border">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Меню"
                className="h-10 w-10 -ml-2 flex items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border flex flex-col">
              <SheetTitle className="sr-only">Навигация</SheetTitle>
              {SidebarBody}
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="font-display font-bold text-sidebar-foreground truncate">{t("app_name")}</div>
          </div>

          <div className="flex gap-1 bg-sidebar-accent rounded-md p-0.5 shrink-0">
            {(["kg", "ru"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-[10px] font-semibold px-2 py-1 rounded transition ${
                  lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto pb-24 lg:pb-8">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-sidebar/95 backdrop-blur border-t border-sidebar-border pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5">
            {bottomItems.map((item) => {
              const active = loc.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition ${
                    active ? "text-primary" : "text-muted-foreground hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition`} />
                  <span className="truncate max-w-full px-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

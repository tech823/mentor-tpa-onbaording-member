import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Link2,
  FileText,
  FileCheck2,
  Download,
  Users,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  key: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ to: "/", key: "dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    heading: "Management",
    items: [
      { to: "/corporates", key: "corporates", icon: Building2 },
      { to: "/programmes", key: "programmes", icon: FolderKanban },
      { to: "/onboarding-links", key: "onboardingLinks", icon: Link2 },
      { to: "/submissions", key: "submissions", icon: FileText },
      { to: "/documents", key: "documents", icon: FileCheck2 },
      { to: "/exports", key: "exports", icon: Download },
    ],
  },
  {
    heading: "Administration",
    items: [
      { to: "/users", key: "users", icon: Users },
      { to: "/audit-logs", key: "auditLogs", icon: ScrollText },
      { to: "/settings", key: "settings", icon: Settings },
    ],
  },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // mobileOpen → slide-in drawer on phones; collapsed → icons-only on desktop.
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — drawer on mobile, collapsible on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex h-full w-64 flex-col border-e border-border/70 bg-card transition-all duration-200",
          "md:static md:z-auto md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-4">
          <img src="/logo.png" alt="Mentor TPA" className={cn("h-7 w-auto", collapsed && "md:hidden")} />
          {/* Desktop collapse/expand */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.heading} className="pt-3 first:pt-0">
              <p
                className={cn(
                  "px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60",
                  collapsed && "md:hidden"
                )}
              >
                {group.heading}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, key, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? t(`nav.${key}`) : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        collapsed && "md:justify-center md:gap-0 md:px-0",
                        isActive
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-primary" />}
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")} />
                        <span className={cn(collapsed && "md:hidden")}>{t(`nav.${key}`)}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main column — header fixed, content scrolls */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-card/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <img src="/logo.png" alt="Mentor TPA" className="h-6 w-auto md:hidden" />
          </div>
          <div className="ms-auto flex items-center gap-3">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground shadow-sm ring-2 ring-primary/10 transition-transform hover:scale-105">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.fullName}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                    <span className="mt-1 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {user?.role}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4" />
                  {t("auth.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:px-6 md:py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

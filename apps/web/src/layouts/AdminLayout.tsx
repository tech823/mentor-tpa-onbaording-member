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
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
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

const navItems: NavItem[] = [
  { to: "/", key: "dashboard", icon: LayoutDashboard, end: true },
  { to: "/corporates", key: "corporates", icon: Building2 },
  { to: "/programmes", key: "programmes", icon: FolderKanban },
  { to: "/onboarding-links", key: "onboardingLinks", icon: Link2 },
  { to: "/submissions", key: "submissions", icon: FileText },
  { to: "/documents", key: "documents", icon: FileCheck2 },
  { to: "/exports", key: "exports", icon: Download },
  { to: "/users", key: "users", icon: Users },
  { to: "/audit-logs", key: "auditLogs", icon: ScrollText },
  { to: "/settings", key: "settings", icon: Settings },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      {/* Sidebar — fixed, full height, only its own nav scrolls */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-e border-border/70 bg-card md:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border/70 px-5">
          <img src="/logo.png" alt="Mentor TPA" className="h-7 w-auto" />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
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
                  {t(`nav.${key}`)}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column — header fixed, content scrolls */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-card/80 px-4 backdrop-blur-md md:px-8">
          <div className="md:hidden">
            <img src="/logo.png" alt="Mentor TPA" className="h-6 w-auto" />
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

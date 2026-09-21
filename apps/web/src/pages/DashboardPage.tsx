import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Building2,
  FolderKanban,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useDashboardStats } from "@/features/dashboard/dashboard.api";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  IN_PROGRESS: "#38bdf8",
  SUBMITTED: "#0ea5e9",
  UNDER_REVIEW: "#f59e0b",
  VERIFIED: "#10b981",
  REJECTED: "#ef4444",
  COMPLETED: "#14b8a6",
};

interface Kpi {
  icon: LucideIcon;
  label: string;
  value: number;
  tint: string;
  ring: string;
  to: string;
}

function KpiCard({ icon: Icon, label, value, tint, ring, to }: Kpi) {
  return (
    <Link to={to} className="group">
      <Card className="relative overflow-hidden transition-all hover:-translate-y-0.5 hover:card-shadow-lg">
        <div className={`absolute inset-x-0 top-0 h-1 ${ring}`} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data } = useDashboardStats();
  const stats = data?.data;
  const totals = stats?.totals;
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  const kpis: Kpi[] = [
    { icon: Building2, label: t("dashboard.totalCorporates"), value: totals?.corporates ?? 0, tint: "bg-primary/10 text-primary", ring: "bg-primary", to: "/corporates" },
    { icon: FolderKanban, label: t("dashboard.activeProgrammes"), value: totals?.activeProgrammes ?? 0, tint: "bg-violet-100 text-violet-600", ring: "bg-violet-500", to: "/programmes" },
    { icon: FileText, label: t("dashboard.totalSubmissions"), value: totals?.totalSubmissions ?? 0, tint: "bg-sky-100 text-sky-600", ring: "bg-sky-500", to: "/submissions" },
    { icon: Clock, label: t("dashboard.pendingReview"), value: totals?.pending ?? 0, tint: "bg-amber-100 text-amber-600", ring: "bg-amber-500", to: "/submissions" },
    { icon: CheckCircle2, label: t("dashboard.verified"), value: totals?.verified ?? 0, tint: "bg-emerald-100 text-emerald-600", ring: "bg-emerald-500", to: "/submissions" },
    { icon: XCircle, label: t("dashboard.rejected"), value: totals?.rejected ?? 0, tint: "bg-rose-100 text-rose-600", ring: "bg-rose-500", to: "/submissions" },
  ];

  const donutData = Object.entries(stats?.byStatus ?? {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value, color: STATUS_COLORS[name] ?? "#94a3b8" }));

  const perDay = (stats?.perDay ?? []).map((d) => ({ ...d, label: fmtDay(d.date) }));
  const byCorporate = stats?.byCorporate ?? [];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white card-shadow-lg md:p-6">
        <div className="absolute -end-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-14 end-24 h-32 w-32 rounded-full bg-primary/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">Welcome back,</p>
            <h1 className="text-2xl font-bold md:text-3xl">{firstName} 👋</h1>
            <p className="mt-1 max-w-lg text-sm text-white/80">
              Here's what's happening across your onboarding programmes today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/programmes/new"><Plus className="h-4 w-4" /> New Programme</Link>
            </Button>
            <Button asChild size="sm" className="bg-white/15 text-white shadow-none hover:bg-white/25">
              <Link to="/submissions">Submissions</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend area */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Submissions — last 14 days</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={perDay} margin={{ left: -20, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(222 100% 55%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(222 100% 55%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 26% 90%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(210 26% 88%)", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" name="Submissions" stroke="hsl(222 100% 50%)" strokeWidth={2.5} fill="url(#areaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By status</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {donutData.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(210 26% 88%)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {donutData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By corporate bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Submissions by corporate</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {byCorporate.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No submissions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, byCorporate.length * 46)}>
              <BarChart data={byCorporate} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 26% 90%)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: "#334155" }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(206 33% 96%)" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(210 26% 88%)", fontSize: 12 }} />
                <Bar dataKey="count" name="Submissions" fill="hsl(222 100% 52%)" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

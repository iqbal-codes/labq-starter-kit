import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Building2,
  Clock,
  CheckCircle2,
  Kanban,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@labq-modules/ui/components/badge";
import { Button } from "@labq-modules/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@labq-modules/ui/components/card";
import { PageHeader } from "@labq-modules/ui/components/page-header";
import { Skeleton } from "@labq-modules/ui/components/skeleton";
import { Separator } from "@labq-modules/ui/components/separator";
import { cn } from "@labq-modules/ui/lib/utils";
import { orpc } from "../../runtime";
import type { SummaryResponse } from "../shared/types";

export function OverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(orpc.crm.summary.queryOptions());
  const summary = (data as SummaryResponse | undefined) ?? null;

  // Calculate active pipeline value & open deals count
  const totalPipelineValue = summary
    ? summary.stageCounts
        .filter((s) => s.kind === "open")
        .reduce((acc, stage) => acc + stage.totalValue, 0)
    : 0;

  const totalActiveDeals = summary
    ? summary.stageCounts
        .filter((s) => s.kind === "open")
        .reduce((acc, stage) => acc + stage.dealCount, 0)
    : 0;

  // Calculate win rate: won / (won + lost)
  const winRate =
    summary && summary.wonDeals + summary.lostDeals > 0
      ? Math.round((summary.wonDeals / (summary.wonDeals + summary.lostDeals)) * 100)
      : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="CRM Overview"
        subtitle="Lead funnel, deal flow, and task pressure at a glance."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/pipeline")}
              className="rounded-4xl"
            >
              <Kanban className="size-4" />
              <span>Pipeline board</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/deals")}
              className="rounded-4xl"
            >
              <Briefcase className="size-4" />
              <span>Manage deals</span>
            </Button>
          </div>
        }
      />

      {/* Workspace Directory Cards */}
      <Card className="rounded-[26px]">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-semibold">Workspace directory</CardTitle>
          <CardDescription>Accounts and records in the CRM database</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
            {/* Leads */}
            <button
              type="button"
              onClick={() => navigate("/leads")}
              className="group/dir flex flex-col gap-2 p-4 md:pr-8 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Leads</span>
                <Users className="size-4 transition-transform group-hover/dir:translate-x-0.5" />
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {isLoading || !summary ? <Skeleton className="h-9 w-16" /> : summary.leads}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Active prospects captured and qualifying in the funnel.
              </p>
            </button>

            {/* Contacts */}
            <button
              type="button"
              onClick={() => navigate("/contacts")}
              className="group/dir flex flex-col gap-2 p-4 md:px-8 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer text-left md:border-l border-border/50"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Contacts</span>
                <UserCheck className="size-4 transition-transform group-hover/dir:translate-x-0.5" />
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {isLoading || !summary ? <Skeleton className="h-9 w-16" /> : summary.contacts}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Individual stakeholders with communication history.
              </p>
            </button>

            {/* Companies */}
            <button
              type="button"
              onClick={() => navigate("/companies")}
              className="group/dir flex flex-col gap-2 p-4 md:pl-8 hover:bg-muted/50 rounded-2xl transition-all cursor-pointer text-left md:border-l border-border/50"
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Companies</span>
                <Building2 className="size-4 transition-transform group-hover/dir:translate-x-0.5" />
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {isLoading || !summary ? <Skeleton className="h-9 w-16" /> : summary.companies}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Corporate accounts and organization records.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline & Outcomes Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Pipeline Details (Wide) */}
        <Card className="lg:col-span-2 rounded-[26px]">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
            <div>
              <CardTitle className="text-base font-semibold">Active sales pipeline</CardTitle>
              <CardDescription>Deal distribution and progress across sales stages</CardDescription>
            </div>
            {!isLoading && summary && (
              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  Pipeline Value
                </p>
                <p className="font-semibold text-lg text-foreground tabular-nums">
                  Rp {totalPipelineValue.toLocaleString("id-ID")}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isLoading || !summary ? (
              <div className="space-y-4">
                <Skeleton className="h-2.5 w-full rounded-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Custom Monochrome Progress Bar */}
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                  {summary.stageCounts
                    .filter((stage) => stage.kind === "open")
                    .map((stage, index) => {
                      const percentage =
                        totalPipelineValue > 0 ? (stage.totalValue / totalPipelineValue) * 100 : 0;
                      if (percentage === 0) return null;

                      // Dynamic opacity step based on index
                      const bgClass =
                        index === 0
                          ? "bg-foreground"
                          : index === 1
                            ? "bg-foreground/80"
                            : index === 2
                              ? "bg-foreground/60"
                              : index === 3
                                ? "bg-foreground/40"
                                : index === 4
                                  ? "bg-foreground/25"
                                  : "bg-foreground/15";

                      return (
                        <div
                          key={stage.id}
                          className={cn(
                            "h-full border-r border-background last:border-r-0 transition-all duration-300",
                            bgClass,
                          )}
                          style={{ width: `${percentage}%` }}
                          title={`${stage.name}: Rp ${stage.totalValue.toLocaleString("id-ID")} (${percentage.toFixed(0)}%)`}
                        />
                      );
                    })}
                </div>

                {/* Stage Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {summary.stageCounts.map((stage) => {
                    const isOpen = stage.kind === "open";
                    return (
                      <div
                        key={stage.id}
                        className={cn(
                          "group/stage flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200",
                          isOpen
                            ? "bg-card border-border hover:bg-muted/20"
                            : "bg-muted/10 border-border/40 border-dashed hover:bg-muted/25",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-foreground tracking-tight block">
                              {stage.name}
                            </span>
                            <Badge
                              variant={
                                stage.kind === "won"
                                  ? "default"
                                  : stage.kind === "lost"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="text-[9px] font-semibold px-1.5 h-4 uppercase tracking-wider"
                            >
                              {stage.kind}
                            </Badge>
                          </div>
                          <Badge
                            variant="outline"
                            className="font-semibold text-xs tabular-nums bg-background/50 h-5 px-1.5 rounded-full border-border/50"
                          >
                            {stage.dealCount}
                          </Badge>
                        </div>

                        <div className="pt-3 border-t border-border/30 mt-3 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                            Value
                          </span>
                          <span className="text-sm font-medium text-foreground tabular-nums">
                            Rp {stage.totalValue.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion & Tasks (Narrow) */}
        <Card className="rounded-[26px]">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-semibold">Outcomes & velocity</CardTitle>
            <CardDescription>Funnel conversion and operational health</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isLoading || !summary ? (
              <div className="space-y-6">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                {/* Win Rate / Outcomes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Deal win rate</span>
                    <span className="text-sm font-bold text-foreground">{winRate}%</span>
                  </div>

                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    {summary.wonDeals + summary.lostDeals > 0 ? (
                      <>
                        <div
                          className="h-full bg-foreground transition-all duration-300"
                          style={{
                            width: `${(summary.wonDeals / (summary.wonDeals + summary.lostDeals)) * 100}%`,
                          }}
                          title={`Won: ${summary.wonDeals}`}
                        />
                        <div
                          className="h-full bg-muted-foreground/30 transition-all duration-300"
                          style={{
                            width: `${(summary.lostDeals / (summary.wonDeals + summary.lostDeals)) * 100}%`,
                          }}
                          title={`Lost: ${summary.lostDeals}`}
                        />
                      </>
                    ) : (
                      <div className="h-full bg-muted w-full" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-foreground" />
                      <span className="font-medium text-foreground">{summary.wonDeals} won</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                      <span>{summary.lostDeals} lost</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="size-3.5" />
                      <span>{totalActiveDeals} active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                    <span className="font-medium">Total registered deals</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {summary.deals}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Task Pressure / Overdue Tasks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Follow-up activities
                    </span>
                    <Badge
                      variant={summary.overdueTasks > 0 ? "destructive" : "outline"}
                      className="text-[10px] font-semibold px-2 py-0 h-5 rounded-full"
                    >
                      {summary.overdueTasks} overdue
                    </Badge>
                  </div>

                  {summary.overdueTasks > 0 ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <Clock className="size-4 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-destructive">
                            Attention Required
                          </p>
                          <p className="text-xs text-destructive/80 leading-relaxed">
                            {summary.overdueTasks} activity follow-up
                            {summary.overdueTasks === 1 ? "" : "s"} overdue. Stale pipeline tasks
                            can impact conversion velocity.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs font-medium h-8 rounded-4xl bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent transition-all duration-150"
                        onClick={() => navigate("/contacts")}
                      >
                        Resolve tasks
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-foreground shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">Clean Slate</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            All tasks and activities are currently up to date. Excellent pipeline
                            hygiene.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

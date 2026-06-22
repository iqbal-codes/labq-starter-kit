import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Briefcase, CheckCircle2, ClipboardList, Clock3, Users } from "lucide-react";
import { Button } from "@admin-template/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@admin-template/ui/components/card";
import { PageHeader } from "@admin-template/ui/components/page-header";
import { Skeleton } from "@admin-template/ui/components/skeleton";
import type { SummaryResponse } from "../operations/shared/types";
import { operationsSummaryQueryOptions } from "../operations/api/queries";

const cards = [
  { key: "customers", title: "Customers", description: "Active customer records.", icon: Users },
  {
    key: "services",
    title: "Services",
    description: "Offerings your team can deliver.",
    icon: Briefcase,
  },
  {
    key: "orders",
    title: "Orders",
    description: "Orders tracked in the workspace.",
    icon: ClipboardList,
  },
  {
    key: "openOrders",
    title: "Open Orders",
    description: "Draft, confirmed, and in-progress work.",
    icon: Clock3,
  },
  {
    key: "completedOrders",
    title: "Completed Orders",
    description: "Delivered work ready for review or follow-up.",
    icon: CheckCircle2,
  },
] as const satisfies Array<{
  key: keyof SummaryResponse;
  title: string;
  description: string;
  icon: typeof Users;
}>;

export function OverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(operationsSummaryQueryOptions());
  const summary = data ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="Operations Overview"
        subtitle="A neutral sample workspace showing customers, services, and orders in one admin shell."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/customers")}>
              Customers
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/services")}>
              Services
            </Button>
            <Button size="sm" onClick={() => navigate("/orders")}>
              Orders
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="rounded-2xl">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="size-4" />
                </div>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading || !summary ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-semibold tracking-tight">{summary[card.key]}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>What this template demonstrates</CardTitle>
          <CardDescription>
            Organization-scoped auth, permission-gated CRUD, reusable forms, reusable data tables,
            and a shell that can be adapted to ecommerce, custom-order, or service-business
            workflows.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

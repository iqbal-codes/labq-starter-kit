import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@labq-modules/ui/components/button";
import { PageContainer } from "@labq-modules/ui/components/page-container";
import { PageHeader } from "@labq-modules/ui/components/page-header";
import { Separator } from "@labq-modules/ui/components/separator";
import { orpc } from "../../runtime";
import { ActivityTimeline } from "../shared/components/activity-timeline";
import type { CompanyRow } from "../shared/types";

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(orpc.crm.companies.get.queryOptions({ input: { id: id! } }));

  const company = (data as CompanyRow | undefined) ?? null;

  if (isLoading) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title=""
          subtitle="Loading..."
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/companies")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!company) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title=""
          subtitle="Not found"
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/companies")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="7xl">
      <PageHeader
        title={company.name}
        subtitle="Company detail"
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate("/companies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />
      <div className="grid gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Status</span>
          <p className="capitalize">{company.status}</p>
        </div>
        {company.industry && (
          <div>
            <span className="text-muted-foreground">Industry</span>
            <p>{company.industry}</p>
          </div>
        )}
        {company.website && (
          <div>
            <span className="text-muted-foreground">Website</span>
            <p>{company.website}</p>
          </div>
        )}
        {company.email && (
          <div>
            <span className="text-muted-foreground">Email</span>
            <p>{company.email}</p>
          </div>
        )}
        {company.phone && (
          <div>
            <span className="text-muted-foreground">Phone</span>
            <p>{company.phone}</p>
          </div>
        )}
        {company.address && (
          <div>
            <span className="text-muted-foreground">Address</span>
            <p className="whitespace-pre-wrap">{company.address}</p>
          </div>
        )}
      </div>
      <Separator />
      <ActivityTimeline entityType="company" entityId={company.id} />
    </PageContainer>
  );
}

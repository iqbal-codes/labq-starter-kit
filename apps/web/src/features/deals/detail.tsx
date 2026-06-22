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
import { useCrmLookups } from "../shared/use-crm-lookups";
import type { DealRow } from "../shared/types";

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyNameById, contactNameById, stageNameById } = useCrmLookups();

  const { data, isLoading, isError } = useQuery(
    orpc.crm.deals.get.queryOptions({ input: { id: id! } }),
  );

  const deal = (data as DealRow | null) ?? null;

  if (isLoading) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title=""
          subtitle="Loading..."
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/deals")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (isError || !deal) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title=""
          subtitle="Not found"
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/deals")}>
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
        title={deal.title}
        subtitle="Deal detail"
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate("/deals")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />
      <div className="grid gap-3 text-sm">
        {deal.stageId && (
          <div>
            <span className="text-muted-foreground">Stage</span>
            <p>{stageNameById.get(deal.stageId) ?? "—"}</p>
          </div>
        )}
        {deal.value && (
          <div>
            <span className="text-muted-foreground">Value</span>
            <p>Rp {Number(deal.value).toLocaleString("id-ID")}</p>
          </div>
        )}
        {deal.companyId && (
          <div>
            <span className="text-muted-foreground">Company</span>
            <p>{companyNameById.get(deal.companyId) ?? "—"}</p>
          </div>
        )}
        {deal.contactId && (
          <div>
            <span className="text-muted-foreground">Contact</span>
            <p>{contactNameById.get(deal.contactId) ?? "—"}</p>
          </div>
        )}
        {deal.expectedCloseDate && (
          <div>
            <span className="text-muted-foreground">Expected close</span>
            <p>{new Date(deal.expectedCloseDate).toLocaleDateString()}</p>
          </div>
        )}
        {deal.notes && (
          <div>
            <span className="text-muted-foreground">Notes</span>
            <p className="whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </div>
      <Separator />
      <ActivityTimeline entityType="deal" entityId={deal.id} />
    </PageContainer>
  );
}

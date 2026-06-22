import React from "react";
import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@labq-modules/ui/components/button";
import { PageContainer } from "@labq-modules/ui/components/page-container";
import { PageHeader } from "@labq-modules/ui/components/page-header";
import { Separator } from "@labq-modules/ui/components/separator";
import { orpc } from "../../runtime";
import { useCrmLookups } from "../shared/use-crm-lookups";
import { ActivityTimeline } from "../shared/components/activity-timeline";
import { ContactAttachmentsPanel } from "./components/contact-attachments-panel";
import type { ContactRow } from "../shared/types";

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companyNameById } = useCrmLookups();

  const { data: contact, isPending } = useQuery(
    orpc.crm.contacts.get.queryOptions({ input: { id: id! } }),
  );

  if (isPending) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title=""
          subtitle="Loading..."
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/contacts")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!contact) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title=""
          subtitle="Not found"
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/contacts")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const companyName = contact.companyId ? (companyNameById.get(contact.companyId) ?? null) : null;

  return (
    <PageContainer width="7xl">
      <PageHeader
        title={contact.name}
        subtitle="Contact detail"
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate("/contacts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid gap-3 text-sm">
        {contact.email && (
          <div>
            <span className="text-muted-foreground">Email</span>
            <p>{contact.email}</p>
          </div>
        )}
        {contact.phone && (
          <div>
            <span className="text-muted-foreground">Phone</span>
            <p>{contact.phone}</p>
          </div>
        )}
        {companyName && (
          <div>
            <span className="text-muted-foreground">Company</span>
            <p>{companyName}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Status</span>
          <p>{contact.status}</p>
        </div>
        {contact.source && (
          <div>
            <span className="text-muted-foreground">Source</span>
            <p>{contact.source}</p>
          </div>
        )}
        {contact.notes && (
          <div>
            <span className="text-muted-foreground">Notes</span>
            <p className="whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}
      </div>

      <Separator />

      <ActivityTimeline entityType="contact" entityId={contact.id} />

      <Separator />

      <ContactAttachmentsPanel contactId={contact.id} />
    </PageContainer>
  );
}

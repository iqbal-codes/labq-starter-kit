import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@labq-modules/ui/components/button";
import { PageContainer } from "@labq-modules/ui/components/page-container";
import { PageHeader } from "@labq-modules/ui/components/page-header";
import { Separator } from "@labq-modules/ui/components/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@labq-modules/ui/components/dialog";
import { useAppForm, useFormFields } from "@labq-modules/ui/components/forms/use-form-hooks";
import { scrollToFirstError } from "@labq-modules/ui/components/forms/tanstack-form";
import { orpc } from "../../runtime";
import { usePermissions } from "../../hooks/use-permissions";
import { ActivityTimeline } from "../shared/components/activity-timeline";
import { useCrmLookups } from "../shared/use-crm-lookups";
import { EMPTY_LEAD_CONVERT_FORM } from "../shared/constants";
import { leadConvertSchema } from "../shared/form-schemas";
import type { LeadConvertValues, LeadRow } from "../shared/types";

function formatConvertedAt(value: string | Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString();
}

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { stageOptions } = useCrmLookups();
  const { FormCheckboxField, FormNumberField, FormSelectField, FormTextField } =
    useFormFields<LeadConvertValues>();

  const { data, isLoading } = useQuery(orpc.crm.leads.get.queryOptions({ input: { id: id! } }));
  const lead = (data as LeadRow | undefined) ?? null;

  // Convert dialog state
  const [convertOpen, setConvertOpen] = React.useState(false);
  const convertForm = useAppForm({
    defaultValues: EMPTY_LEAD_CONVERT_FORM,
    validators: { onSubmit: leadConvertSchema },
    onSubmitInvalid: () => scrollToFirstError(),
    onSubmit: async ({ value }) => {
      if (!lead) return;
      await orpc.crm.leads.convert.call({
        id: lead.id,
        contactName: value.contactName,
        companyName: value.companyName || undefined,
        createCompany: value.createCompany,
        createDeal: value.createDeal,
        dealTitle: value.dealTitle || undefined,
        dealValue:
          value.dealValue === "" || value.dealValue === undefined
            ? undefined
            : Number(value.dealValue),
        stageId: value.stageId || undefined,
      });
      setConvertOpen(false);
    },
  });

  if (isLoading) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title="Lead"
          subtitle="Loading..."
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/leads")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!lead) {
    return (
      <PageContainer width="7xl">
        <PageHeader
          title="Lead"
          subtitle="Not found"
          backButton={
            <Button variant="outline" size="icon" onClick={() => navigate("/leads")}>
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
        title={lead.name}
        subtitle="Lead detail"
        backButton={
          <Button variant="outline" size="icon" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />
      <div className="flex-1">
        <div className="space-y-6">
          <div className="grid gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Status</span>
              <p>{lead.status}</p>
            </div>
            {lead.email && (
              <div>
                <span className="text-muted-foreground">Email</span>
                <p>{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div>
                <span className="text-muted-foreground">Phone</span>
                <p>{lead.phone}</p>
              </div>
            )}
            {lead.companyName && (
              <div>
                <span className="text-muted-foreground">Company</span>
                <p>{lead.companyName}</p>
              </div>
            )}
            {lead.source && (
              <div>
                <span className="text-muted-foreground">Source</span>
                <p>{lead.source}</p>
              </div>
            )}
            {lead.notes && (
              <div>
                <span className="text-muted-foreground">Notes</span>
                <p className="whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
            {lead.convertedAt && (
              <div>
                <span className="text-muted-foreground">Converted</span>
                <p>{formatConvertedAt(lead.convertedAt)}</p>
              </div>
            )}
          </div>
          {hasPermission("crm.update") && lead.status !== "converted" && (
            <Button
              size="sm"
              onClick={() => {
                convertForm.reset({
                  contactName: lead.name,
                  companyName: lead.companyName ?? "",
                  createCompany: !!lead.companyName,
                  createDeal: false,
                  dealTitle: `${lead.name} Opportunity`,
                  dealValue: "",
                  stageId: stageOptions[0]?.value ?? "",
                });
                setConvertOpen(true);
              }}
            >
              Convert lead
            </Button>
          )}
          <Separator />
          <ActivityTimeline entityType="lead" entityId={lead.id} />
        </div>
      </div>
      <convertForm.AppForm>
        <convertForm.Form>
          <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convert lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormTextField name="contactName" label="Contact name" required />
                <FormCheckboxField name="createCompany" label="Create or link company" />
                <FormTextField name="companyName" label="Company name" />
                <FormCheckboxField name="createDeal" label="Create first deal" />
                <FormTextField name="dealTitle" label="Deal title" />
                <FormNumberField
                  name="dealValue"
                  label="Deal value"
                  prefix="Rp "
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                />
                <FormSelectField name="stageId" label="Initial stage" options={stageOptions} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setConvertOpen(false)}>
                  Cancel
                </Button>
                <convertForm.SubmitButton>Convert lead</convertForm.SubmitButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </convertForm.Form>
      </convertForm.AppForm>
    </PageContainer>
  );
}

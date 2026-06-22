import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@labq-modules/ui/components/button";
import { useFormFields } from "@labq-modules/ui/components/forms/use-form-hooks";
import { PageHeader } from "@labq-modules/ui/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@labq-modules/ui/components/select";
import { DataTable } from "@labq-modules/ui/components/table/data-table";
import { DataTableSkeleton } from "@labq-modules/ui/components/table/data-table-skeleton";
import { DataTableToolbar } from "@labq-modules/ui/components/table/data-table-toolbar";
import { orpc } from "../../runtime";
import { badgeColumn } from "../shared/columns";
import { EMPTY_LEAD_FORM, LEAD_STATUS_OPTIONS } from "../shared/constants";
import { CrmFormDialog, type CrmDialogFormApi } from "../shared/form-dialog";
import { leadFormSchema } from "../shared/form-schemas";
import type { LeadFormValues, LeadRow } from "../shared/types";
import { useCrmDataTable } from "../shared/use-crm-data-table";

const leadColumns: ColumnDef<LeadRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { variant: "text", placeholder: "Search leads..." },
    enableSorting: true,
    enableColumnFilter: true,
  },
  { accessorKey: "email", header: "Email", enableSorting: true },
  { accessorKey: "companyName", header: "Company", enableSorting: true },
  badgeColumn<LeadRow, "status">("status", "Status", LEAD_STATUS_OPTIONS),
];

function toLeadMutationInput(value: LeadFormValues) {
  return {
    name: value.name,
    email: value.email || undefined,
    phone: value.phone || undefined,
    companyName: value.companyName || undefined,
    status: value.status,
    source: value.source || undefined,
    notes: value.notes || undefined,
  };
}

function toLeadFormValues(row: LeadRow): LeadFormValues {
  return {
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    companyName: row.companyName ?? "",
    status: row.status,
    source: row.source ?? "",
    notes: row.notes ?? "",
  };
}

function LeadFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: CrmDialogFormApi;
}) {
  const { FormTextField, FormTextareaField, FormSelectField } = useFormFields<LeadFormValues>();
  return (
    <CrmFormDialog {...props}>
      <FormTextField name="name" label="Name" required />
      <FormTextField name="email" label="Email" type="email" />
      <FormTextField name="phone" label="Phone" type="tel" />
      <FormTextField name="companyName" label="Company" />
      <FormSelectField name="status" label="Status" options={LEAD_STATUS_OPTIONS} />
      <FormTextField name="source" label="Source" />
      <FormTextareaField name="notes" label="Notes" />
    </CrmFormDialog>
  );
}

export function LeadsPage() {
  const crm = useCrmDataTable({
    entityName: "leads",
    emptyFormValues: EMPTY_LEAD_FORM,
    formSchema: leadFormSchema,
    filterId: "status",
    filterOptions: LEAD_STATUS_OPTIONS,
    columns: leadColumns,
    getRowId: (row) => row.id,
    toFormValues: toLeadFormValues,
    toMutationInput: toLeadMutationInput,
    orpcList: orpc.crm.leads.list,
    orpcCreate: orpc.crm.leads.create,
    orpcUpdate: orpc.crm.leads.update,
    orpcSoftDelete: orpc.crm.leads.softDelete,
    orpcSummary: orpc.crm.summary,
    messages: {
      createSuccess: "Lead created",
      updateSuccess: "Lead updated",
      deleteSuccess: "Lead deleted",
      deleteConfirm: "Delete this lead?",
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <PageHeader
        title="Leads"
        subtitle="Capture, qualify, and convert prospects."
        actions={
          crm.canCreate ? <Button onClick={crm.openCreateDialog}>Add Lead</Button> : undefined
        }
      />
      {crm.isLoading && crm.data.length === 0 ? (
        <DataTableSkeleton columnCount={crm.columns.length} />
      ) : (
        <DataTable table={crm.table} onRowClick={crm.onRowClick}>
          <DataTableToolbar table={crm.table}>
            <Select
              value={crm.filterValue || "all"}
              onValueChange={(value) => void crm.setFilterValue(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {crm.filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DataTableToolbar>
        </DataTable>
      )}
      <LeadFormDialog
        open={crm.dialogOpen}
        onOpenChange={crm.handleDialogOpenChange}
        title={crm.editing ? "Edit lead" : "New lead"}
        form={crm.form}
      />
    </div>
  );
}

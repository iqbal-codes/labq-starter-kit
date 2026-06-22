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
import { lookupColumn } from "../shared/columns";
import { EMPTY_DEAL_FORM } from "../shared/constants";
import { CrmFormDialog, type CrmDialogFormApi } from "../shared/form-dialog";
import { dealFormSchema } from "../shared/form-schemas";
import type { DealFormValues, DealRow } from "../shared/types";
import { useCrmDataTable } from "../shared/use-crm-data-table";
import { useCrmLookups } from "../shared/use-crm-lookups";

function toDealMutationInput(value: DealFormValues) {
  return {
    title: value.title,
    companyId: value.companyId || undefined,
    contactId: value.contactId || undefined,
    stageId: value.stageId || undefined,
    value: value.value === "" || value.value === undefined ? undefined : Number(value.value),
    expectedCloseDate: value.expectedCloseDate || undefined,
    notes: value.notes || undefined,
  };
}

function toDealFormValues(row: DealRow): DealFormValues {
  return {
    title: row.title,
    companyId: row.companyId ?? "",
    contactId: row.contactId ?? "",
    stageId: row.stageId ?? "",
    value: row.value ?? "",
    expectedCloseDate: row.expectedCloseDate ?? "",
    notes: row.notes ?? "",
  };
}

function DealFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: CrmDialogFormApi;
  companyOptions: Array<{ value: string; label: string }>;
  contactOptions: Array<{ value: string; label: string }>;
  stageOptions: Array<{ value: string; label: string }>;
}) {
  const {
    FormTextField,
    FormNumberField,
    FormDatePickerField,
    FormTextareaField,
    FormComboboxField,
    FormSelectField,
  } = useFormFields<DealFormValues>();
  return (
    <CrmFormDialog {...props}>
      <FormTextField name="title" label="Title" required />
      <FormComboboxField
        name="companyId"
        label="Company"
        options={props.companyOptions}
        placeholder="Select a company"
        emptyMessage="No companies found."
      />
      <FormComboboxField
        name="contactId"
        label="Contact"
        options={props.contactOptions}
        placeholder="Select a contact"
        emptyMessage="No contacts found."
      />
      <FormSelectField name="stageId" label="Pipeline stage" options={props.stageOptions} />
      <FormNumberField
        name="value"
        label="Value (IDR)"
        prefix="Rp "
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
      />
      <FormDatePickerField name="expectedCloseDate" label="Expected close date" />
      <FormTextareaField name="notes" label="Notes" />
    </CrmFormDialog>
  );
}

export function DealsPage() {
  const {
    companyOptions,
    contactOptions,
    stageOptions,
    companyNameById,
    contactNameById,
    stageNameById,
  } = useCrmLookups();
  const columns = React.useMemo<ColumnDef<DealRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        meta: { variant: "text", placeholder: "Search deals..." },
        enableSorting: true,
        enableColumnFilter: true,
      },
      lookupColumn<DealRow, "stageId">("stageId", "Stage", stageNameById, {
        meta: { variant: "select", options: stageOptions },
      }),
      lookupColumn<DealRow, "companyId">("companyId", "Company", companyNameById),
      lookupColumn<DealRow, "contactId">("contactId", "Contact", contactNameById),
      {
        accessorKey: "value",
        header: "Value",
        enableSorting: true,
        cell: ({ row }) => {
          const value = row.original.value;
          if (!value) return "—";
          return `Rp ${Number(value).toLocaleString("id-ID")}`;
        },
      },
      {
        accessorKey: "expectedCloseDate",
        header: "Close date",
        enableSorting: true,
        cell: ({ row }) =>
          row.original.expectedCloseDate
            ? new Date(row.original.expectedCloseDate).toLocaleDateString()
            : "—",
      },
    ],
    [companyNameById, contactNameById, stageNameById, stageOptions],
  );
  const crm = useCrmDataTable({
    entityName: "deals",
    emptyFormValues: EMPTY_DEAL_FORM,
    formSchema: dealFormSchema,
    filterId: "stageId",
    filterOptions: stageOptions,
    columns,
    getRowId: (row) => row.id,
    toFormValues: toDealFormValues,
    toMutationInput: toDealMutationInput,
    orpcList: orpc.crm.deals.list,
    orpcCreate: orpc.crm.deals.create,
    orpcUpdate: orpc.crm.deals.update,
    orpcSoftDelete: orpc.crm.deals.softDelete,
    orpcSummary: orpc.crm.summary,
    messages: {
      createSuccess: "Deal created",
      updateSuccess: "Deal updated",
      deleteSuccess: "Deal deleted",
      deleteConfirm: "Delete this deal?",
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <PageHeader
        title="Deals"
        subtitle="Pipeline opportunities with stage tracking."
        actions={
          crm.canCreate ? <Button onClick={crm.openCreateDialog}>Add Deal</Button> : undefined
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
                <SelectValue placeholder="All Stages" />
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
      <DealFormDialog
        open={crm.dialogOpen}
        onOpenChange={crm.handleDialogOpenChange}
        title={crm.editing ? "Edit deal" : "New deal"}
        form={crm.form}
        companyOptions={companyOptions}
        contactOptions={contactOptions}
        stageOptions={stageOptions}
      />
    </div>
  );
}

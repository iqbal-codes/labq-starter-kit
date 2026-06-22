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
import { COMPANY_STATUS_OPTIONS, EMPTY_COMPANY_FORM } from "../shared/constants";
import { CrmFormDialog, type CrmDialogFormApi } from "../shared/form-dialog";
import { companyFormSchema } from "../shared/form-schemas";
import type { CompanyFormValues, CompanyRow } from "../shared/types";
import { useCrmDataTable } from "../shared/use-crm-data-table";

const companyColumns: ColumnDef<CompanyRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { variant: "text", placeholder: "Search companies..." },
    enableSorting: true,
    enableColumnFilter: true,
  },
  badgeColumn<CompanyRow, "status">("status", "Status", COMPANY_STATUS_OPTIONS),
  { accessorKey: "email", header: "Email", enableSorting: true },
  { accessorKey: "phone", header: "Phone", enableSorting: true },
];

function toCompanyMutationInput(value: CompanyFormValues) {
  return {
    name: value.name,
    status: value.status,
    industry: value.industry || undefined,
    website: value.website || undefined,
    email: value.email || undefined,
    phone: value.phone || undefined,
    address: value.address || undefined,
  };
}

function toCompanyFormValues(row: CompanyRow): CompanyFormValues {
  return {
    name: row.name,
    status: row.status,
    industry: row.industry ?? "",
    website: row.website ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
  };
}

function CompanyFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: CrmDialogFormApi;
}) {
  const { FormTextField, FormTextareaField, FormSelectField } = useFormFields<CompanyFormValues>();
  return (
    <CrmFormDialog {...props}>
      <FormTextField name="name" label="Name" required />
      <FormSelectField name="status" label="Status" options={COMPANY_STATUS_OPTIONS} />
      <FormTextField name="industry" label="Industry" />
      <FormTextField name="website" label="Website" />
      <FormTextField name="email" label="Email" type="email" />
      <FormTextField name="phone" label="Phone" type="tel" />
      <FormTextareaField name="address" label="Address" />
    </CrmFormDialog>
  );
}

export function CompaniesPage() {
  const crm = useCrmDataTable({
    entityName: "companies",
    emptyFormValues: EMPTY_COMPANY_FORM,
    formSchema: companyFormSchema,
    filterId: "status",
    filterOptions: COMPANY_STATUS_OPTIONS,
    columns: companyColumns,
    getRowId: (row) => row.id,
    toFormValues: toCompanyFormValues,
    toMutationInput: toCompanyMutationInput,
    orpcList: orpc.crm.companies.list,
    orpcCreate: orpc.crm.companies.create,
    orpcUpdate: orpc.crm.companies.update,
    orpcSoftDelete: orpc.crm.companies.softDelete,
    orpcSummary: orpc.crm.summary,
    messages: {
      createSuccess: "Company created",
      updateSuccess: "Company updated",
      deleteSuccess: "Company deleted",
      deleteConfirm: "Delete this company?",
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <PageHeader
        title="Companies"
        subtitle="Accounts and business relationships."
        actions={
          crm.canCreate ? <Button onClick={crm.openCreateDialog}>Add Company</Button> : undefined
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
      <CompanyFormDialog
        open={crm.dialogOpen}
        onOpenChange={crm.handleDialogOpenChange}
        title={crm.editing ? "Edit company" : "New company"}
        form={crm.form}
      />
    </div>
  );
}

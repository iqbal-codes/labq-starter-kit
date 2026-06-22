import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@labq-modules/ui/components/button";
import { useFormFields } from "@labq-modules/ui/components/forms/use-form-hooks";
import { CsvImportDialog } from "@labq-modules/ui/components/import-export/csv-import-dialog";
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
import { downloadCsv } from "@labq-modules/ui/lib/csv";
import {
  CONTACT_IMPORT_EXPORT_FIELDS,
  contactImportRowSchema,
  type ContactImportRow,
} from "@labq-modules/schemas";
import { toast } from "sonner";
import { orpc } from "../../runtime";
import { badgeColumn, lookupColumn } from "../shared/columns";
import {
  CONTACT_CSV_COLUMNS,
  CONTACT_STATUS_OPTIONS,
  EMPTY_CONTACT_FORM,
} from "../shared/constants";
import { CrmFormDialog, type CrmDialogFormApi } from "../shared/form-dialog";
import { contactFormSchema } from "../shared/form-schemas";
import type { ContactFormValues, ContactRow } from "../shared/types";
import { useCrmDataTable } from "../shared/use-crm-data-table";
import { useCrmLookups } from "../shared/use-crm-lookups";

function toContactMutationInput(value: ContactFormValues) {
  return {
    name: value.name,
    email: value.email || undefined,
    phone: value.phone || undefined,
    companyId: value.companyId || undefined,
    status: value.status,
    source: value.source || undefined,
    notes: value.notes || undefined,
  };
}

function toContactFormValues(row: ContactRow): ContactFormValues {
  return {
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    companyId: row.companyId ?? "",
    status: row.status,
    source: row.source ?? "",
    notes: row.notes ?? "",
  };
}

function ContactFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: CrmDialogFormApi;
  companyOptions: Array<{ value: string; label: string }>;
}) {
  const { FormTextField, FormTextareaField, FormComboboxField, FormSelectField } =
    useFormFields<ContactFormValues>();
  return (
    <CrmFormDialog {...props}>
      <FormTextField name="name" label="Name" required />
      <FormTextField name="email" label="Email" type="email" />
      <FormTextField name="phone" label="Phone" type="tel" />
      <FormComboboxField
        name="companyId"
        label="Company"
        options={props.companyOptions}
        placeholder="Select a company"
        emptyMessage="No companies found."
      />
      <FormSelectField name="status" label="Status" options={CONTACT_STATUS_OPTIONS} />
      <FormTextField name="source" label="Source" />
      <FormTextareaField name="notes" label="Notes" />
    </CrmFormDialog>
  );
}

export function ContactsPage() {
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = React.useState(false);
  const { companyNameById, companyOptions } = useCrmLookups();
  const columns = React.useMemo<ColumnDef<ContactRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        meta: { variant: "text", placeholder: "Search contacts..." },
        enableSorting: true,
        enableColumnFilter: true,
      },
      { accessorKey: "email", header: "Email", enableSorting: true },
      { accessorKey: "phone", header: "Phone", enableSorting: true },
      lookupColumn<ContactRow, "companyId">("companyId", "Company", companyNameById),
      badgeColumn<ContactRow, "status">("status", "Status", CONTACT_STATUS_OPTIONS),
    ],
    [companyNameById],
  );
  const crm = useCrmDataTable({
    entityName: "contacts",
    emptyFormValues: EMPTY_CONTACT_FORM,
    formSchema: contactFormSchema,
    filterId: "status",
    filterOptions: CONTACT_STATUS_OPTIONS,
    columns,
    getRowId: (row) => row.id,
    toFormValues: toContactFormValues,
    toMutationInput: toContactMutationInput,
    orpcList: orpc.crm.contacts.list,
    orpcCreate: orpc.crm.contacts.create,
    orpcUpdate: orpc.crm.contacts.update,
    orpcSoftDelete: orpc.crm.contacts.softDelete,
    orpcSummary: orpc.crm.summary,
    messages: {
      createSuccess: "Contact created",
      updateSuccess: "Contact updated",
      deleteSuccess: "Contact deleted",
      deleteConfirm: "Delete this contact?",
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <PageHeader
        title="Contacts"
        subtitle="People records with activity and attachments."
        actions={
          crm.canCreate ? <Button onClick={crm.openCreateDialog}>Add Contact</Button> : undefined
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
            {crm.canView && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const rows = await queryClient.fetchQuery(
                      orpc.crm.contacts.exportRows.queryOptions({
                        input: {
                          search: crm.search || undefined,
                          status: crm.filterValue || undefined,
                          sort: crm.sort.length ? JSON.stringify(crm.sort) : undefined,
                        },
                      }),
                    );
                    downloadCsv({
                      filename: "contacts-export.csv",
                      headers: CONTACT_IMPORT_EXPORT_FIELDS,
                      rows: rows as readonly Record<string, unknown>[],
                    });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Export failed");
                  }
                }}
              >
                Export CSV
              </Button>
            )}
            {crm.canCreate && (
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                Import CSV
              </Button>
            )}
          </DataTableToolbar>
        </DataTable>
      )}
      <ContactFormDialog
        open={crm.dialogOpen}
        onOpenChange={crm.handleDialogOpenChange}
        title={crm.editing ? "Edit contact" : "New contact"}
        form={crm.form}
        companyOptions={companyOptions}
      />
      <CsvImportDialog<ContactImportRow>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import contacts"
        columns={CONTACT_CSV_COLUMNS}
        schema={contactImportRowSchema}
        templateFilename="contacts-import.csv"
        onImport={async (rows) => {
          const result = await orpc.crm.contacts.bulkCreate.call({ records: rows });
          await crm.invalidate();
          toast.success("Contacts imported");
          return result as {
            importBatchId: string;
            successCount: number;
            errorCount: number;
            errors: { rowNumber: number; message: string; values: ContactImportRow }[];
          };
        }}
      />
    </div>
  );
}

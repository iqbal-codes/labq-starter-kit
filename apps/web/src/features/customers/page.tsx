import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@admin-template/ui/components/button";
import { useFormFields } from "@admin-template/ui/components/forms/use-form-hooks";
import { PageHeader } from "@admin-template/ui/components/page-header";
import { DataTable } from "@admin-template/ui/components/table/data-table";
import { DataTableSkeleton } from "@admin-template/ui/components/table/data-table-skeleton";
import { DataTableToolbar } from "@admin-template/ui/components/table/data-table-toolbar";
import { customerListQueryOptions } from "./api/queries";
import {
  createCustomerMutation,
  updateCustomerMutation,
  softDeleteCustomerMutation,
} from "./api/mutations";
import { operationsKeys } from "../operations/api/queries";
import { badgeColumn } from "../shared/columns";
import { EntityFormDialog } from "../shared/form-dialog";
import type { EntityDialogFormApi } from "../shared/form-dialog";
import { useEntityDataTable } from "../shared/use-entity-data-table";
import { CUSTOMER_STATUS_OPTIONS, EMPTY_CUSTOMER_FORM } from "../operations/shared/constants";
import { customerFormSchema } from "../operations/shared/form-schemas";
import type { CustomerFormValues, CustomerRow } from "../operations/shared/types";

const customerColumns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { variant: "text", placeholder: "Search customers..." },
    enableSorting: true,
    enableColumnFilter: true,
  },
  badgeColumn<CustomerRow, "status">("status", "Status", CUSTOMER_STATUS_OPTIONS, {
    enableColumnFilter: true,
  }),
  { accessorKey: "email", header: "Email", enableSorting: true },
  { accessorKey: "phone", header: "Phone", enableSorting: true },
];

function toCustomerMutationInput(value: CustomerFormValues) {
  return {
    name: value.name,
    email: value.email || undefined,
    phone: value.phone || undefined,
    status: value.status,
    notes: value.notes || undefined,
  };
}

function toCustomerFormValues(row: CustomerRow): CustomerFormValues {
  return {
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    status: row.status,
    notes: row.notes ?? "",
  };
}

function CustomerFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: EntityDialogFormApi;
}) {
  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<CustomerFormValues>();
  return (
    <EntityFormDialog {...props}>
      <FormTextField name="name" label="Name" required />
      <FormTextField name="email" label="Email" type="email" />
      <FormTextField name="phone" label="Phone" type="tel" />
      <FormSelectField name="status" label="Status" options={CUSTOMER_STATUS_OPTIONS} />
      <FormTextareaField name="notes" label="Notes" />
    </EntityFormDialog>
  );
}

export function CustomersPage() {
  const entity = useEntityDataTable({
    emptyFormValues: EMPTY_CUSTOMER_FORM,
    formSchema: customerFormSchema,
    filterId: "status",
    filterOptions: CUSTOMER_STATUS_OPTIONS,
    columns: customerColumns,
    getRowId: (row) => row.id,
    toFormValues: toCustomerFormValues,
    toMutationInput: toCustomerMutationInput,
    listQueryOptions: customerListQueryOptions,
    createMutation: createCustomerMutation,
    updateMutation: updateCustomerMutation,
    softDeleteMutation: softDeleteCustomerMutation,
    summaryQueryKey: operationsKeys.summary(),
    permissions: {
      view: "operations.view",
      create: "operations.create",
      update: "operations.update",
      delete: "operations.delete",
    },
    messages: {
      createSuccess: "Customer created",
      updateSuccess: "Customer updated",
      deleteSuccess: "Customer deleted",
      deleteConfirm: "Delete this customer?",
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <PageHeader
        title="Customers"
        subtitle="People and organizations receiving your services or orders."
        actions={
          entity.canCreate ? (
            <Button onClick={entity.openCreateDialog}>Add Customer</Button>
          ) : undefined
        }
      />
      {entity.isLoading && entity.data.length === 0 ? (
        <DataTableSkeleton columnCount={entity.columns.length} />
      ) : (
        <DataTable table={entity.table}>
          <DataTableToolbar table={entity.table} />
        </DataTable>
      )}
      <CustomerFormDialog
        open={entity.dialogOpen}
        onOpenChange={entity.handleDialogOpenChange}
        title={entity.editing ? "Edit customer" : "New customer"}
        form={entity.form}
      />
    </div>
  );
}

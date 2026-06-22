import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@admin-template/ui/components/button";
import { useFormFields } from "@admin-template/ui/components/forms/use-form-hooks";
import { PageHeader } from "@admin-template/ui/components/page-header";
import { DataTable } from "@admin-template/ui/components/table/data-table";
import { DataTableSkeleton } from "@admin-template/ui/components/table/data-table-skeleton";
import { DataTableToolbar } from "@admin-template/ui/components/table/data-table-toolbar";
import { badgeColumn } from "../shared/columns";
import { serviceListQueryOptions } from "./api/queries";
import {
  createServiceMutation,
  updateServiceMutation,
  softDeleteServiceMutation,
} from "./api/mutations";
import { operationsKeys } from "../operations/api/queries";
import { EntityFormDialog } from "../shared/form-dialog";
import type { EntityDialogFormApi } from "../shared/form-dialog";
import { useEntityDataTable } from "../shared/use-entity-data-table";
import { EMPTY_SERVICE_FORM, SERVICE_STATUS_OPTIONS } from "../operations/shared/constants";
import { serviceFormSchema } from "../operations/shared/form-schemas";
import type { ServiceFormValues, ServiceRow } from "../operations/shared/types";

const serviceColumns: ColumnDef<ServiceRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { variant: "text", placeholder: "Search services..." },
    enableSorting: true,
    enableColumnFilter: true,
  },
  badgeColumn<ServiceRow, "status">("status", "Status", SERVICE_STATUS_OPTIONS, {
    enableColumnFilter: true,
  }),
  {
    accessorKey: "price",
    header: "Price",
    enableSorting: true,
    cell: ({ row }) => {
      const price = row.original.price;
      if (price === null || price === undefined || price === "") return "—";
      return `Rp ${Number(price).toLocaleString("id-ID")}`;
    },
  },
  { accessorKey: "description", header: "Description" },
];

function toServiceMutationInput(value: ServiceFormValues) {
  return {
    name: value.name,
    description: value.description || undefined,
    status: value.status,
    price: value.price === "" || value.price === undefined ? undefined : Number(value.price),
  };
}

function toServiceFormValues(row: ServiceRow): ServiceFormValues {
  return {
    name: row.name,
    description: row.description ?? "",
    status: row.status,
    price: row.price ?? "",
  };
}

function ServiceFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: EntityDialogFormApi;
}) {
  const { FormTextField, FormSelectField, FormTextareaField, FormNumberField } =
    useFormFields<ServiceFormValues>();
  return (
    <EntityFormDialog {...props}>
      <FormTextField name="name" label="Name" required />
      <FormSelectField name="status" label="Status" options={SERVICE_STATUS_OPTIONS} />
      <FormNumberField
        name="price"
        label="Price (IDR)"
        prefix="Rp "
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
      />
      <FormTextareaField name="description" label="Description" />
    </EntityFormDialog>
  );
}

export function ServicesPage() {
  const entity = useEntityDataTable({
    emptyFormValues: EMPTY_SERVICE_FORM,
    formSchema: serviceFormSchema,
    filterId: "status",
    filterOptions: SERVICE_STATUS_OPTIONS,
    columns: serviceColumns,
    getRowId: (row) => row.id,
    toFormValues: toServiceFormValues,
    toMutationInput: toServiceMutationInput,
    listQueryOptions: serviceListQueryOptions,
    createMutation: createServiceMutation,
    updateMutation: updateServiceMutation,
    softDeleteMutation: softDeleteServiceMutation,
    summaryQueryKey: operationsKeys.summary(),
    permissions: {
      view: "operations.view",
      create: "operations.create",
      update: "operations.update",
      delete: "operations.delete",
    },
    messages: {
      createSuccess: "Service created",
      updateSuccess: "Service updated",
      deleteSuccess: "Service deleted",
      deleteConfirm: "Delete this service?",
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <PageHeader
        title="Services"
        subtitle="Reusable offerings your team can sell, schedule, or deliver."
        actions={
          entity.canCreate ? (
            <Button onClick={entity.openCreateDialog}>Add Service</Button>
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
      <ServiceFormDialog
        open={entity.dialogOpen}
        onOpenChange={entity.handleDialogOpenChange}
        title={entity.editing ? "Edit service" : "New service"}
        form={entity.form}
      />
    </div>
  );
}

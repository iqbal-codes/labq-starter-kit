import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@admin-template/ui/components/button";
import { useFormFields } from "@admin-template/ui/components/forms/use-form-hooks";
import { PageHeader } from "@admin-template/ui/components/page-header";
import { DataTable } from "@admin-template/ui/components/table/data-table";
import { DataTableSkeleton } from "@admin-template/ui/components/table/data-table-skeleton";
import { DataTableToolbar } from "@admin-template/ui/components/table/data-table-toolbar";
import { badgeColumn, lookupColumn } from "../shared/columns";
import { EntityFormDialog } from "../shared/form-dialog";
import type { EntityDialogFormApi } from "../shared/form-dialog";
import { useEntityDataTable } from "../shared/use-entity-data-table";
import { EMPTY_ORDER_FORM, ORDER_STATUS_OPTIONS } from "../operations/shared/constants";
import { orderFormSchema } from "../operations/shared/form-schemas";
import type { OrderFormValues, OrderRow } from "../operations/shared/types";
import { useOperationsLookups } from "../operations/shared/use-operations-lookups";
import { orderListQueryOptions } from "./api/queries";
import { createOrderMutation, updateOrderMutation, softDeleteOrderMutation } from "./api/mutations";
import { operationsKeys } from "../operations/api/queries";

function toOrderMutationInput(value: OrderFormValues) {
  return {
    title: value.title,
    customerId: value.customerId || undefined,
    serviceId: value.serviceId || undefined,
    status: value.status,
    totalAmount:
      value.totalAmount === "" || value.totalAmount === undefined
        ? undefined
        : Number(value.totalAmount),
    dueDate: value.dueDate || undefined,
    notes: value.notes || undefined,
  };
}

function toOrderFormValues(row: OrderRow): OrderFormValues {
  return {
    title: row.title,
    customerId: row.customerId ?? "",
    serviceId: row.serviceId ?? "",
    status: row.status,
    totalAmount: row.totalAmount ?? "",
    dueDate: row.dueDate ?? "",
    notes: row.notes ?? "",
  };
}

function OrderFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: EntityDialogFormApi;
  customerOptions: Array<{ value: string; label: string }>;
  serviceOptions: Array<{ value: string; label: string }>;
}) {
  const { FormTextField, FormSelectField, FormNumberField, FormTextareaField } =
    useFormFields<OrderFormValues>();
  return (
    <EntityFormDialog {...props}>
      <FormTextField name="title" label="Title" required />
      <FormSelectField name="customerId" label="Customer" options={props.customerOptions} />
      <FormSelectField name="serviceId" label="Service" options={props.serviceOptions} />
      <FormSelectField name="status" label="Status" options={ORDER_STATUS_OPTIONS} />
      <FormNumberField
        name="totalAmount"
        label="Total amount (IDR)"
        prefix="Rp "
        decimalScale={2}
        fixedDecimalScale
        allowNegative={false}
      />
      <FormTextField name="dueDate" label="Due date" placeholder="2026-12-31" />
      <FormTextareaField name="notes" label="Notes" />
    </EntityFormDialog>
  );
}

export function OrdersPage() {
  const { customerOptions, serviceOptions, customerNameById, serviceNameById } =
    useOperationsLookups();
  const columns = React.useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        meta: { variant: "text", placeholder: "Search orders..." },
        enableSorting: true,
        enableColumnFilter: true,
      },
      lookupColumn<OrderRow, "customerId">("customerId", "Customer", customerNameById),
      lookupColumn<OrderRow, "serviceId">("serviceId", "Service", serviceNameById),
      badgeColumn<OrderRow, "status">("status", "Status", ORDER_STATUS_OPTIONS, {
        enableColumnFilter: true,
      }),
      {
        accessorKey: "totalAmount",
        header: "Total",
        enableSorting: true,
        cell: ({ row }) => {
          const amount = row.original.totalAmount;
          return `Rp ${Number(amount).toLocaleString("id-ID")}`;
        },
      },
      {
        accessorKey: "dueDate",
        header: "Due date",
        enableSorting: true,
        cell: ({ row }) =>
          row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : "—",
      },
    ],
    [customerNameById, serviceNameById],
  );
  const entity = useEntityDataTable({
    emptyFormValues: EMPTY_ORDER_FORM,
    formSchema: orderFormSchema,
    filterId: "status",
    filterOptions: ORDER_STATUS_OPTIONS,
    columns,
    getRowId: (row) => row.id,
    toFormValues: toOrderFormValues,
    toMutationInput: toOrderMutationInput,
    listQueryOptions: orderListQueryOptions,
    createMutation: createOrderMutation,
    updateMutation: updateOrderMutation,
    softDeleteMutation: softDeleteOrderMutation,
    summaryQueryKey: operationsKeys.summary(),
    permissions: {
      view: "operations.view",
      create: "operations.create",
      update: "operations.update",
      delete: "operations.delete",
    },
    messages: {
      createSuccess: "Order created",
      updateSuccess: "Order updated",
      deleteSuccess: "Order deleted",
      deleteConfirm: "Delete this order?",
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <PageHeader
        title="Orders"
        subtitle="Track work from draft to completion across customers and services."
        actions={
          entity.canCreate ? (
            <Button onClick={entity.openCreateDialog}>Add Order</Button>
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
      <OrderFormDialog
        open={entity.dialogOpen}
        onOpenChange={entity.handleDialogOpenChange}
        title={entity.editing ? "Edit order" : "New order"}
        form={entity.form}
        customerOptions={customerOptions}
        serviceOptions={serviceOptions}
      />
    </div>
  );
}

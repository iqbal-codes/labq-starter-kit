import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { getApiError } from "@admin-template/api-client";
import { Button } from "@admin-template/ui/components/button";
import { useFormFields } from "@admin-template/ui/components/forms/use-form-hooks";
import { PageHeader } from "@admin-template/ui/components/page-header";
import { DataTable } from "@admin-template/ui/components/table/data-table";
import { DataTableSkeleton } from "@admin-template/ui/components/table/data-table-skeleton";
import { DataTableToolbar } from "@admin-template/ui/components/table/data-table-toolbar";
import { formatBytes } from "@admin-template/ui/lib/utils";
import { toast } from "sonner";
import { badgeColumn } from "../shared/columns";
import { serviceListQueryOptions, servicePhotosQueryOptions } from "./api/queries";
import {
  createServiceMutation,
  deleteServicePhotoMutation,
  softDeleteServiceMutation,
  updateServiceMutation,
} from "./api/mutations";
import type { PersistedAttachment } from "../operations/shared/media-client";
import { uploadServicePhotos } from "../operations/shared/media-client";
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
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category ?? "—",
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
    category: value.category,
    description: value.description || undefined,
    status: value.status,
    price: value.price === "" ? null : value.price === undefined ? undefined : Number(value.price),
  };
}

function toServiceFormValues(row: ServiceRow): ServiceFormValues {
  return {
    name: row.name,
    category: row.category ?? "",
    photos: [],
    description: row.description ?? "",
    status: row.status,
    price: row.price ?? "",
  };
}

function ExistingServicePhotos({ serviceId }: { serviceId: string }) {
  const queryClient = useQueryClient();
  const { data: photos = [] } = useQuery({
    ...servicePhotosQueryOptions(serviceId),
    enabled: !!serviceId,
  });
  const deletePhoto = useMutation({
    ...deleteServicePhotoMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: servicePhotosQueryOptions(serviceId).queryKey,
      });
      toast.success("Photo removed");
    },
    onError: (error) => {
      toast.error(getApiError(error).message);
    },
  });

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">Current photos</p>
        <p className="text-muted-foreground text-sm">Saved to storage and loaded from the API.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo) => (
          <PersistedPhotoCard
            key={photo.id}
            photo={photo}
            onDelete={() => deletePhoto.mutate({ serviceId, attachmentId: photo.id })}
            isDeleting={deletePhoto.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function PersistedPhotoCard({
  photo,
  onDelete,
  isDeleting,
}: {
  photo: PersistedAttachment;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <img
        src={photo.downloadUrl}
        alt={photo.fileName}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="space-y-3 p-3">
        <div className="space-y-1">
          <p className="line-clamp-1 text-sm font-medium">{photo.fileName}</p>
          <p className="text-muted-foreground text-xs">{formatBytes(photo.sizeBytes)}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onDelete}
          isLoading={isDeleting}
        >
          Remove photo
        </Button>
      </div>
    </div>
  );
}

function ServiceFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: EntityDialogFormApi;
  serviceId?: string;
}) {
  const {
    FormPhotoUploadField,
    FormTextField,
    FormSelectField,
    FormTextareaField,
    FormNumberField,
  } = useFormFields<ServiceFormValues>();
  return (
    <EntityFormDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.title}
      form={props.form}
    >
      <FormTextField name="name" label="Name" required />
      <FormTextField
        name="category"
        label="Category"
        description="Optional public storefront grouping label."
      />
      {props.serviceId ? <ExistingServicePhotos serviceId={props.serviceId} /> : null}
      <FormPhotoUploadField
        name="photos"
        label="Photos"
        description="Upload service or product photos. Saving adds them to the existing gallery."
      />
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
    afterSave: async ({ id, values }) => {
      if (!values.photos || values.photos.length === 0) return;
      await uploadServicePhotos(id, values.photos);
    },
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
        serviceId={entity.editing?.id}
      />
    </div>
  );
}

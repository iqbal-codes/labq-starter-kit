import React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseMutationOptions } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useAppForm } from "@admin-template/ui/components/forms/use-form-hooks";
import { scrollToFirstError } from "@admin-template/ui/components/forms/tanstack-form";
import { useDataTable } from "@admin-template/ui/hooks/use-data-table";
import { getSortingStateParser } from "@admin-template/ui/lib/parsers";
import type { PermissionKey } from "@admin-template/types";
import { toast } from "sonner";
import { getApiError } from "@admin-template/api-client";
import { usePermissions } from "../../hooks/use-permissions";
import { actionsColumn } from "./columns";

type OptionItem = {
  value: string;
  label: string;
};

type EntityFormValues = Record<string, unknown>;

type ListInput = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
};

export interface EntityDataTableConfig<
  TRow extends object,
  TFormValues extends EntityFormValues,
  TListInput extends ListInput,
  TDeleteInput = { id: string },
> {
  emptyFormValues: TFormValues;
  formSchema: unknown;
  filterId: string;
  filterOptions?: OptionItem[];
  columns: ColumnDef<TRow>[];
  getRowId: (row: TRow) => string;
  toFormValues: (row: TRow) => TFormValues;
  toMutationInput: (values: TFormValues) => Record<string, unknown>;
  listQueryOptions: (input: TListInput) => { queryKey: QueryKey; [key: string]: unknown };
  createMutation: () => unknown;
  updateMutation: () => unknown;
  softDeleteMutation: () => unknown;
  afterSave?: (params: {
    id: string;
    mode: "create" | "update";
    values: TFormValues;
  }) => Promise<void>;
  summaryQueryKey?: QueryKey;
  permissions: {
    view: PermissionKey;
    create: PermissionKey;
    update: PermissionKey;
    delete: PermissionKey;
  };
  messages: {
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    deleteConfirm: string;
  };
}

function getSortableColumnIds<TRow>(columns: ColumnDef<TRow>[]) {
  return columns.flatMap((column) => {
    if (column.enableSorting === false) return [];
    if (typeof column.id === "string") return [column.id];
    if ("accessorKey" in column && typeof column.accessorKey === "string") {
      return [column.accessorKey];
    }
    return [];
  });
}

export function useEntityDataTable<
  TRow extends object,
  TFormValues extends EntityFormValues,
  TListInput extends ListInput,
  TDeleteInput = { id: string },
>(config: EntityDataTableConfig<TRow, TFormValues, TListInput, TDeleteInput>) {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TRow | null>(null);

  // Capture the initial empty defaults once so TanStack Form does not
  // re-apply a fresh empty object after an edit flow calls form.reset(rowValues).
  const emptyDefaultsRef = React.useRef(config.emptyFormValues);
  const emptyDefaults = emptyDefaultsRef.current;
  const formDefaultValues = React.useMemo(
    () => (editing ? config.toFormValues(editing) : emptyDefaults),
    [config.toFormValues, editing, emptyDefaults],
  );
  const sortIds = React.useMemo(() => getSortableColumnIds(config.columns), [config.columns]);
  const [{ page, perPage, search, sort }] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(50),
    search: parseAsString.withDefault(""),
    sort: getSortingStateParser<TRow>(sortIds).withDefault([]),
  });
  const [filterValue, setFilterValue] = useQueryState(
    config.filterId,
    parseAsString.withDefault(""),
  );
  const normalizedFilterValue = filterValue ?? "";
  const listInput = React.useMemo(
    () =>
      ({
        page,
        pageSize: perPage,
        search: search || undefined,
        [config.filterId]: normalizedFilterValue || undefined,
        sort: sort.length ? JSON.stringify(sort) : undefined,
      }) as TListInput,
    [config.filterId, normalizedFilterValue, page, perPage, search, sort],
  );

  const listOptions = React.useMemo(
    () => config.listQueryOptions(listInput),
    [config.listQueryOptions, listInput],
  );
  const listQueryKey = listOptions.queryKey;
  const { data: listData, isLoading } = useQuery({
    ...listOptions,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    ...(config.createMutation() as UseMutationOptions<
      unknown,
      Error,
      Record<string, unknown>,
      unknown
    >),
  });

  const updateMutation = useMutation({
    ...(config.updateMutation() as UseMutationOptions<
      unknown,
      Error,
      Record<string, unknown>,
      unknown
    >),
  });

  const deleteMutation = useMutation({
    ...(config.softDeleteMutation() as UseMutationOptions<
      unknown,
      Error,
      Record<string, unknown>,
      unknown
    >),
    onSuccess: async () => {
      await invalidate();
      toast.success(config.messages.deleteSuccess);
    },
    onError: (error) => {
      const { message } = getApiError(error);
      toast.error(message);
    },
  });

  async function invalidate() {
    const tasks: Promise<unknown>[] = [queryClient.invalidateQueries({ queryKey: listQueryKey })];
    if (config.summaryQueryKey) {
      tasks.push(queryClient.invalidateQueries({ queryKey: config.summaryQueryKey }));
    }
    await Promise.all(tasks);
  }

  async function onSubmit({
    value,
    formApi,
  }: {
    value: TFormValues;
    formApi: { setErrorMap: (errorMap: Record<string, unknown>) => void };
  }) {
    const payload = config.toMutationInput(value);
    try {
      if (editing) {
        const id = config.getRowId(editing);
        await updateMutation.mutateAsync({ id, ...payload });
        try {
          await config.afterSave?.({ id, mode: "update", values: value });
        } catch (error) {
          toast.error(`Record saved, but media upload failed: ${getApiError(error).message}`);
        }
        await invalidate();
        toast.success(config.messages.updateSuccess);
        handleDialogOpenChange(false);
        return;
      }

      const created = (await createMutation.mutateAsync(payload)) as { id?: string } | undefined;
      const id = created?.id;
      if (!id) {
        throw new Error("Create mutation did not return an id");
      }

      try {
        await config.afterSave?.({ id, mode: "create", values: value });
      } catch (error) {
        toast.error(`Record saved, but media upload failed: ${getApiError(error).message}`);
      }

      await invalidate();
      toast.success(config.messages.createSuccess);
      handleDialogOpenChange(false);
    } catch (error) {
      const { message } = getApiError(error);
      formApi.setErrorMap({ onSubmit: { form: message, fields: {} } });
      toast.error(message);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditing(null);
      form.reset(emptyDefaults);
    }
  }

  const form = useAppForm({
    defaultValues: formDefaultValues,
    validators: { onSubmit: config.formSchema as never },
    onSubmitInvalid: () => scrollToFirstError(),
    onSubmit,
  });

  const data = (listData as { items?: TRow[]; total?: number } | undefined)?.items ?? [];
  const total = (listData as { items?: TRow[]; total?: number } | undefined)?.total ?? 0;
  const canCreate = hasPermission(config.permissions.create);
  const canUpdate = hasPermission(config.permissions.update);
  const canDelete = hasPermission(config.permissions.delete);
  const canView = hasPermission(config.permissions.view);

  const openCreateDialog = React.useCallback(() => {
    setEditing(null);
    form.reset(emptyDefaults);
    setDialogOpen(true);
  }, [form]);

  const openEditDialog = React.useCallback(
    (row: TRow) => {
      setEditing(row);
      form.reset(config.toFormValues(row));
      setDialogOpen(true);
    },
    [config, form],
  );

  const handleDelete = React.useCallback(
    (row: TRow) => {
      if (!window.confirm(config.messages.deleteConfirm)) return;
      deleteMutation.mutate({ id: config.getRowId(row) } as Record<string, unknown>);
    },
    [config, deleteMutation],
  );

  const columns = React.useMemo(
    () => [
      ...config.columns,
      actionsColumn({
        canEdit: canUpdate,
        canDelete,
        onEdit: openEditDialog,
        onDelete: handleDelete,
      }),
    ],
    [canDelete, canUpdate, config.columns, handleDelete, openEditDialog],
  );

  const { table } = useDataTable({
    data,
    columns,
    getRowId: (row) => config.getRowId(row),
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    debounceMs: 500,
    initialState: {
      pagination: { pageIndex: page - 1, pageSize: perPage },
      columnPinning: { right: ["actions"] },
    },
  });

  return {
    table,
    columns,
    dialogOpen,
    editing,
    setEditing,
    setDialogOpen,
    handleDialogOpenChange,
    openCreateDialog,
    form,
    invalidate,
    onSubmit,
    data,
    isLoading,
    total,
    page,
    perPage,
    search,
    sort: sort as SortingState,
    filterValue: normalizedFilterValue,
    setFilterValue,
    filterOptions: config.filterOptions ?? [],
    canCreate,
    canUpdate,
    canDelete,
    canView,
  };
}

import React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useNavigate } from "react-router-dom";
import { useAppForm } from "@labq-modules/ui/components/forms/use-form-hooks";
import { scrollToFirstError } from "@labq-modules/ui/components/forms/tanstack-form";
import { useDataTable } from "@labq-modules/ui/hooks/use-data-table";
import { getSortingStateParser } from "@labq-modules/ui/lib/parsers";
import { toast } from "sonner";
import { usePermissions } from "../../hooks/use-permissions";
import { actionsColumn } from "./columns";
import type { OptionItem } from "./types";

interface CrmListResponse<TRow> {
  items?: TRow[];
  total?: number;
}

type CrmFormValues = Record<string, unknown>;

type CrmListInput<TFilterId extends string> = {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
} & Partial<Record<TFilterId, string | undefined>>;

type CrmListQueryOptions<TRow> = UseQueryOptions<
  CrmListResponse<TRow>,
  Error,
  CrmListResponse<TRow>,
  readonly unknown[]
>;

type CrmMutationOptions<TInput> = UseMutationOptions<unknown, Error, TInput, unknown>;

interface CrmMutationCallbacks {
  onSuccess?: (data: unknown) => void | Promise<void>;
  onError?: (error: Error) => void;
}

interface CrmListProcedureLike {
  queryOptions: (...args: never[]) => unknown;
  queryKey: (...args: never[]) => readonly unknown[];
}

interface CrmMutationProcedureLike {
  mutationOptions: (...args: never[]) => unknown;
}

interface CrmSummaryProcedureLike {
  queryKey: (...args: never[]) => readonly unknown[];
}

export interface CrmDataTableConfig<
  TRow extends object,
  TFormValues extends CrmFormValues,
  TMutationInput extends Record<string, unknown>,
  TFilterId extends string = string,
> {
  entityName: string;
  emptyFormValues: TFormValues;
  formSchema: unknown;
  filterId: TFilterId;
  filterOptions?: OptionItem[];
  columns: ColumnDef<TRow>[];
  getRowId: (row: TRow) => string;
  toFormValues: (row: TRow) => TFormValues;
  toMutationInput: (values: TFormValues) => TMutationInput;
  orpcList: CrmListProcedureLike;
  orpcCreate: CrmMutationProcedureLike;
  orpcUpdate: CrmMutationProcedureLike;
  orpcSoftDelete: CrmMutationProcedureLike;
  orpcSummary?: CrmSummaryProcedureLike;
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

function toListQueryOptions<TRow, TFilterId extends string>(
  procedure: CrmListProcedureLike,
  input: CrmListInput<TFilterId>,
) {
  const queryOptions = procedure.queryOptions as unknown as (options: {
    input: CrmListInput<TFilterId>;
    placeholderData?: typeof keepPreviousData;
  }) => CrmListQueryOptions<TRow>;
  return queryOptions({ input, placeholderData: keepPreviousData });
}

function toMutationOptions<TInput>(
  procedure: CrmMutationProcedureLike,
  callbacks: CrmMutationCallbacks,
) {
  const mutationOptions = procedure.mutationOptions as unknown as (
    options: CrmMutationCallbacks,
  ) => CrmMutationOptions<TInput>;
  return mutationOptions(callbacks);
}
function toListQueryKey(procedure: CrmListProcedureLike) {
  const queryKey = procedure.queryKey as unknown as (options: {
    input: Record<string, unknown>;
  }) => readonly unknown[];
  return queryKey({ input: {} });
}

function toSummaryQueryKey(procedure: CrmSummaryProcedureLike) {
  const queryKey = procedure.queryKey as unknown as () => readonly unknown[];
  return queryKey();
}

export function useCrmDataTable<
  TRow extends object,
  TFormValues extends CrmFormValues,
  TMutationInput extends Record<string, unknown>,
  TFilterId extends string,
>(config: CrmDataTableConfig<TRow, TFormValues, TMutationInput, TFilterId>) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TRow | null>(null);
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
  const listInput = React.useMemo(() => {
    const input = {
      page,
      pageSize: perPage,
      search: search || undefined,
      [config.filterId]: normalizedFilterValue || undefined,
      sort: sort.length ? JSON.stringify(sort) : undefined,
    };
    return input as CrmListInput<TFilterId>;
  }, [config.filterId, normalizedFilterValue, page, perPage, search, sort]);
  const { data: listData, isLoading } = useQuery(
    toListQueryOptions<TRow, TFilterId>(config.orpcList, listInput),
  );

  async function invalidate() {
    const invalidations = [
      queryClient.invalidateQueries({
        queryKey: toListQueryKey(config.orpcList),
      }),
    ] as Promise<unknown>[];
    if (config.orpcSummary) {
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: toSummaryQueryKey(config.orpcSummary) }),
      );
    }
    await Promise.all(invalidations);
  }

  async function onSubmit({ value }: { value: TFormValues }) {
    const payload = config.toMutationInput(value);
    if (editing) {
      await updateMutation.mutateAsync({ id: config.getRowId(editing), ...payload });
      return;
    }
    await createMutation.mutateAsync(payload);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditing(null);
      form.reset(config.emptyFormValues);
    }
  }

  const form = useAppForm({
    defaultValues: config.emptyFormValues,
    validators: { onSubmit: config.formSchema as never },
    onSubmitInvalid: () => scrollToFirstError(),
    onSubmit,
  });

  const createMutation = useMutation(
    toMutationOptions<TMutationInput>(config.orpcCreate, {
      onSuccess: async () => {
        await invalidate();
        toast.success(config.messages.createSuccess);
        handleDialogOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateMutation = useMutation(
    toMutationOptions<TMutationInput & { id: string }>(config.orpcUpdate, {
      onSuccess: async () => {
        await invalidate();
        toast.success(config.messages.updateSuccess);
        handleDialogOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    toMutationOptions<{ id: string }>(config.orpcSoftDelete, {
      onSuccess: async () => {
        await invalidate();
        toast.success(config.messages.deleteSuccess);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const data = listData?.items ?? [];
  const total = listData?.total ?? 0;
  const canCreate = hasPermission("crm.create");
  const canUpdate = hasPermission("crm.update");
  const canDelete = hasPermission("crm.delete");
  const canView = hasPermission("crm.view");

  const openCreateDialog = React.useCallback(() => {
    setEditing(null);
    form.reset(config.emptyFormValues);
    setDialogOpen(true);
  }, [config.emptyFormValues, form]);

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
      deleteMutation.mutate({ id: config.getRowId(row) });
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

  const onRowClick = React.useCallback(
    (row: TRow) => {
      navigate(`/${config.entityName}/${config.getRowId(row)}`);
    },
    [config, navigate],
  );

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
    onRowClick,
  };
}

"use client";

import {
  type ColumnFiltersState,
  type ColumnPinningState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  type Parser,
  type UseQueryStateOptions,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { useDebouncedCallback } from "./use-debounced-callback";
import { getSortingStateParser } from "../lib/parsers";
import type { ExtendedColumnSort } from "../types/data-table";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

function getColumnQueryKey<TData>(column: UseDataTableProps<TData>["columns"][number]) {
  if ("id" in column && typeof column.id === "string" && column.id.length > 0) {
    return column.id;
  }

  if ("accessorKey" in column) {
    const accessorKey = column.accessorKey;
    if (typeof accessorKey === "string" && accessorKey.length > 0) {
      return accessorKey;
    }
  }

  return undefined;
}

function getColumnFilterQueryKey<TData>(column: UseDataTableProps<TData>["columns"][number]) {
  const columnId = getColumnQueryKey(column);
  if (!columnId) return undefined;

  return column.meta?.variant === "text" ? "search" : columnId;
}

interface UseDataTableProps<TData>
  extends
    Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount,
    initialState,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    ...tableProps
  } = props;

  const queryStateOptions = React.useMemo<Omit<UseQueryStateOptions<string>, "parse">>(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [history, scroll, shallow, throttleMs, debounceMs, clearOnDefault, startTransition],
  );

  const filterQueryStateOptions = React.useMemo<Omit<UseQueryStateOptions<string>, "parse">>(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      clearOnDefault,
      startTransition,
    }),
    [history, scroll, shallow, throttleMs, clearOnDefault, startTransition],
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  );
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    initialState?.columnPinning ?? {},
  );

  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1),
  );
  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10),
  );

  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: page - 1, // zero-based index -> one-based index
      pageSize: perPage,
    };
  }, [page, perPage]);

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === "function") {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage],
  );

  const columnIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const column of columns) {
      const key = getColumnQueryKey(column);
      if (key !== undefined) s.add(key);
    }
    return s;
  }, [columns]);

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? []),
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === "function") {
        const newSorting = updaterOrValue(sorting);
        void setSorting(newSorting as ExtendedColumnSort<TData>[]);
      } else {
        void setSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting, setSorting],
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];
    const out: Array<{ column: (typeof columns)[number]; columnId: string; queryKey: string }> = [];
    for (const column of columns) {
      if (!column.enableColumnFilter) continue;
      const columnId = getColumnQueryKey(column);
      const queryKey = getColumnFilterQueryKey(column);
      if (columnId && queryKey) out.push({ column, columnId, queryKey });
    }
    return out;
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<Record<string, Parser<string> | Parser<string[]>>>(
      (acc, column) => {
        if (column.column.meta?.options) {
          acc[column.queryKey] = parseAsArrayOf(parseAsString, ARRAY_SEPARATOR).withOptions(
            filterQueryStateOptions,
          );
        } else {
          acc[column.queryKey] = parseAsString.withOptions(filterQueryStateOptions);
        }
        return acc;
      },
      {},
    );
  }, [filterableColumns, filterQueryStateOptions, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback((values: typeof filterValues) => {
    void setPage(1);
    void setFilterValues(values);
  }, debounceMs);

  const filterableByColumnId = React.useMemo(() => {
    const m = new Map<string, (typeof filterableColumns)[number]>();
    for (const c of filterableColumns) m.set(c.columnId, c);
    return m;
  }, [filterableColumns]);

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>((filters, [key, value]) => {
      if (value !== null) {
        const column =
          filterableByColumnId.get(key) ??
          filterableColumns.find((filterableColumn) => filterableColumn.queryKey === key);
        if (!column) return filters;
        const processedValue = Array.isArray(value) ? value : value;

        filters.push({
          id: column.columnId,
          value: processedValue,
        });
      }
      return filters;
    }, []);
  }, [filterValues, filterableByColumnId, filterableColumns, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      const next =
        typeof updaterOrValue === "function" ? updaterOrValue(columnFilters) : updaterOrValue;

      const filterUpdates = next.reduce<Record<string, string | string[] | null>>((acc, filter) => {
        const column = filterableByColumnId.get(filter.id);
        if (column) {
          acc[column.queryKey] = filter.value as string | string[];
        }
        return acc;
      }, {});

      for (const prevFilter of columnFilters) {
        if (!next.some((filter) => filter.id === prevFilter.id)) {
          const column = filterableByColumnId.get(prevFilter.id);
          if (column) filterUpdates[column.queryKey] = null;
        }
      }

      setColumnFilters(next);
      debouncedSetFilterValues(filterUpdates);
    },
    [debouncedSetFilterValues, filterableByColumnId, columnFilters, enableAdvancedFilter],
  );

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      columnPinning,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return { table, shallow, debounceMs, throttleMs };
}

# Data Table System

A TanStack Table + nuqs integration with URL-persisted state (sorting, pagination, filtering), column pinning, faceted filters, date filters, slider filters, view options, and skeleton loading.

## Dependencies

```bash
npm install @tanstack/react-table
npm install nuqs
npm install @radix-ui/react-icons     # Used by toolbar, pagination, view options
npm install date-fns                  # Used by DataTableDateFilter
npm install react-day-picker          # Used by DataTableDateFilter
```

**Note:** The toolbar components (`DataTableToolbar`, `DataTablePagination`, `DataTableViewOptions`) use `next-intl` for translations (`useTranslations('Common')`). If your project doesn't use `next-intl`, you have two options:

1. **Install next-intl** and provide a `Common` namespace with keys: `reset`, `rowsSelected`, `rowsTotal`, `rowsPerPage`, `pageOf`, `toggleColumns`, `searchColumns`, `noColumnsFound`.
2. **Replace `useTranslations`** with static strings in each component.

---

## Quick Start

```tsx
"use client";

import { useDataTable } from "@labq-modules/ui/hooks/use-data-table";
import { DataTable } from "@labq-modules/ui/components/table/data-table";
import { DataTableColumnHeader } from "@labq-modules/ui/components/table/data-table-column-header";
import { DataTableToolbar } from "@labq-modules/ui/components/table/data-table-toolbar";
import { columns } from "./columns";
import type { ColumnDef } from "@tanstack/react-table";

// 1. Define columns with column meta for filter config
const columns: ColumnDef<User>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: {
      label: "Name",
      placeholder: "Search by name...",
      variant: "text",
      icon: Icons.text,
    },
    enableColumnFilter: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

// 2. Use useDataTable hook — manages pagination, sorting, filtering via nuqs URL state
export function UserTable() {
  const { data, pageCount } = useFetchUsers();

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ["actions"] },
    },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

// 3. Loading state
export function UserTableSkeleton() {
  return (
    <DataTableSkeleton
      columnCount={6}
      rowCount={10}
      filterCount={3}
      cellWidths={["12rem", "8rem", "8rem", "5rem", "8rem", "3rem"]}
      withViewOptions
      withPagination
    />
  );
}
```

---

## Architecture

```
components/table/
├── index.tsx                                    # Barrel re-exports
├── data-table.tsx                               # Main DataTable component
├── data-table-column-header.tsx                  # Sortable column header (asc/desc/hide)
├── data-table-pagination.tsx                     # Page controls with page size selector
├── data-table-toolbar.tsx                        # Filter bar + view options
├── data-table-skeleton.tsx                       # Skeleton placeholder
├── data-table-view-options.tsx                   # Column visibility toggler
├── data-table-faceted-filter.tsx                 # Multi/single select dropdown filter
├── data-table-date-filter.tsx                    # Date picker / date range filter
├── data-table-slider-filter.tsx                  # Numeric range slider filter
├── table-demo.tsx                                # Full working example

hooks/
└── use-data-table.ts                             # Hook: nuqs URL state + TanStack Table

lib/
├── data-table.ts                                 # Column pinning styles, filter helpers
└── parsers.ts                                    # nuqs parsers for sort & filter URL state

types/
└── data-table.ts                                 # TypeScript interfaces + ColumnMeta extension
```

---

## Core Hook: `useDataTable`

The `useDataTable` hook is the integration point between TanStack Table and URL state via nuqs.

```tsx
const { table } = useDataTable({
  data, columns, pageCount,
  initialState?: Partial<TableState>,
  history?: 'push' | 'replace',
  debounceMs?: 300,
  throttleMs?: 50,
  clearOnDefault?: false,
  enableAdvancedFilter?: false,
  scroll?: false,
  shallow?: true,
  startTransition?: React.TransitionStartFunction,
  ...tanstackTableOptions
});
```

### URL State It Manages

| Parameter      | Type                                 | URL Key           | Description                                    |
| -------------- | ------------------------------------ | ----------------- | ---------------------------------------------- |
| Pagination     | `{ pageIndex, pageSize }`            | `page`, `perPage` | Page number (1-based in URL) and rows per page |
| Sorting        | `{ id, desc }[]`                     | `sort`            | JSON-serialized sort state                     |
| Column Filters | `{ [columnId]: string \| string[] }` | Per column key    | Text search or multi-select values             |

### Props

| Prop                   | Type                      | Default     | Description                                                    |
| ---------------------- | ------------------------- | ----------- | -------------------------------------------------------------- |
| `data`                 | `TData[]`                 | required    | Table data array                                               |
| `columns`              | `ColumnDef<TData>[]`      | required    | Column definitions                                             |
| `pageCount`            | `number`                  | required    | Total pages (from server)                                      |
| `initialState`         | `Partial<TableState>`     | —           | Initial table state (sorting, pagination, columnPinning, etc.) |
| `history`              | `'push' \| 'replace'`     | `'replace'` | History mode for URL updates                                   |
| `debounceMs`           | `number`                  | `300`       | Debounce for filter updates                                    |
| `throttleMs`           | `number`                  | `50`        | Throttle for URL updates                                       |
| `clearOnDefault`       | `boolean`                 | `false`     | Remove param from URL when default                             |
| `enableAdvancedFilter` | `boolean`                 | `false`     | Enable advanced filter mode                                    |
| `scroll`               | `boolean`                 | `false`     | Scroll to top on page change                                   |
| `shallow`              | `boolean`                 | `true`      | Shallow routing (no RSC round-trip)                            |
| `startTransition`      | `TransitionStartFunction` | —           | React 19 startTransition                                       |

### URL State + Server-Side Prefetching

For the standard pattern (server prefetch → client render):

```tsx
// page.tsx (server component)
import { searchParamsCache } from "@labq-modules/ui/lib/searchparams";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@labq-modules/ui/lib/query-client";
import { usersQueryOptions } from "@/features/users/api/queries";

type PageProps = { searchParams: Promise<SearchParams> };

export default async function UsersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(usersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable />
      </Suspense>
    </HydrationBoundary>
  );
}
```

```tsx
// UserTable.tsx (client component)
"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useDataTable } from "@labq-modules/ui/hooks/use-data-table";
import { getSortingStateParser } from "@labq-modules/ui/lib/parsers";
import { usersQueryOptions } from "@/features/users/api/queries";
import { columns } from "./columns";

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function UserTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    role: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([]),
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.role && { role: params.role }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) }),
  };

  const { data } = useSuspenseQuery(usersQueryOptions(filters));

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount: Math.ceil(data.total_items / params.perPage),
    shallow: true,
    debounceMs: 500,
    initialState: { columnPinning: { right: ["actions"] } },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
```

---

## Column Definitions

### Column Meta (Required for Filters)

For columns that should show filters in the toolbar, define `meta` on the column. The `meta` object extends TanStack Table's `ColumnMeta`:

```tsx
import type { ColumnMeta } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    label?: string; // Display label in filter dropdowns and view options
    placeholder?: string; // Input placeholder for text/number filters
    variant?: FilterVariant; // Filter UI variant
    options?: Option[]; // Options for multiSelect/select variants
    range?: [number, number]; // Default range for slider filters
    unit?: string; // Unit suffix (e.g., "kg", "$")
    icon?: React.FC<React.SVGProps<SVGSVGElement>>; // Icon for filter button
  }
}
```

### Filter Variants

| `meta.variant`  | `enableColumnFilter` | UI Component               | Filter Value                  |
| --------------- | -------------------- | -------------------------- | ----------------------------- |
| `'text'`        | `true`               | `<Input>`                  | Single string                 |
| `'number'`      | `true`               | `<Input type='number'>`    | Single string                 |
| `'range'`       | `true`               | `<DataTableSliderFilter>`  | `[number, number]`            |
| `'date'`        | `true`               | `<DataTableDateFilter>`    | Single timestamp (number)     |
| `'dateRange'`   | `true`               | `<DataTableDateFilter>`    | `[number, number]`            |
| `'select'`      | `true`               | `<DataTableFacetedFilter>` | `string[]` (single selection) |
| `'multiSelect'` | `true`               | `<DataTableFacetedFilter>` | `string[]` (multi selection)  |
| `'boolean'`     | `true`               | —                          | `string[]`                    |

Each variant maps column filter values to specific column states. Set `enableColumnFilter: true` on any column you want to show a filter for.

### Filter Options

For `'select'` and `'multiSelect'` variants, provide `options` in meta:

```tsx
meta: {
  label: 'Status',
  variant: 'multiSelect',
  options: [
    { value: 'active', label: 'Active', count: 42, icon: IconCheck },
    { value: 'inactive', label: 'Inactive', count: 12, icon: IconClose }
  ]
}
```

The `Option` type:

```tsx
interface Option {
  label: string;
  value: string;
  count?: number; // Faceted count (shown in filter dropdown)
  icon?: React.FC<React.SVGProps<SVGSVGElement>>; // Icon next to option
}
```

### Column Pinning

Pin columns (like `actions`) to the right or left so they stay visible during horizontal scroll:

```tsx
initialState: {
  columnPinning: {
    right: ['actions'],
    left: ['select']  // Optional: pin checkbox column to left
  }
}
```

Pinning styles are handled by `getCommonPinningStyles()` from `lib/data-table.ts`.

---

## Components Reference

### `DataTable`

```tsx
import { DataTable } from "@labq-modules/ui/components/table/data-table";

<DataTable table={table} actionBar={<BulkActionBar />}>
  <DataTableToolbar table={table} />
</DataTable>;
```

| Prop        | Type           | Default  | Description                                      |
| ----------- | -------------- | -------- | ------------------------------------------------ |
| `table`     | `Table<TData>` | required | TanStack Table instance                          |
| `actionBar` | `ReactNode`    | —        | Rendered under pagination when rows are selected |
| `children`  | `ReactNode`    | —        | Typically `DataTableToolbar`                     |

Renders inside a `ScrollArea` with horizontal scroll support. Empty state: "No results." in centered cell.

### `DataTableColumnHeader`

```tsx
import { DataTableColumnHeader } from "@labq-modules/ui/components/table/data-table-column-header";

<DataTableColumnHeader column={column} title="Name" />;
```

Sortable column header with a dropdown menu:

- **Asc** / **Desc** sort options (shown when `column.getCanSort()`)
- **Hide** option (shown when `column.getCanHide()`)
- **Reset** option (shown when column is sorted)

For non-sortable columns:

```tsx
header: () => <div className="text-left">Name</div>;
```

### `DataTableToolbar`

```tsx
import { DataTableToolbar } from "@labq-modules/ui/components/table/data-table-toolbar";
import { Button } from "@labq-modules/ui/components/button";

<DataTableToolbar table={table}>
  <Button onClick={handleAdd}>Add User</Button>
</DataTableToolbar>;
```

Auto-renders filter inputs for all columns where `enableColumnFilter: true`, using the column's `meta.variant` to determine filter type. Includes:

- **Reset filters** button (shown when any filter is active)
- **Children** slot (for custom action buttons on the right)
- **View options** toggle button

### `DataTablePagination`

```tsx
import { DataTablePagination } from "@labq-modules/ui/components/table/data-table-pagination";

<DataTablePagination table={table} pageSizeOptions={[10, 20, 30, 50]} />;
```

| Prop              | Type           | Default                | Description             |
| ----------------- | -------------- | ---------------------- | ----------------------- |
| `table`           | `Table<TData>` | required               | TanStack Table instance |
| `pageSizeOptions` | `number[]`     | `[10, 20, 30, 40, 50]` | Available page sizes    |

Shows:

- Selected row count (or total filtered rows)
- Rows per page selector
- Page X of Y
- First / Prev / Next / Last buttons

### `DataTableViewOptions`

Toggle column visibility. Renders inside `DataTableToolbar` automatically.

```tsx
import { DataTableViewOptions } from "@labq-modules/ui/components/table/data-table-view-options";

<DataTableViewOptions table={table} />;
```

### `DataTableFacetedFilter`

```tsx
import { DataTableFacetedFilter } from "@labq-modules/ui/components/table/data-table-faceted-filter";

<DataTableFacetedFilter column={column} title="Status" options={options} multiple={true} />;
```

| Prop       | Type                    | Default  | Description          |
| ---------- | ----------------------- | -------- | -------------------- |
| `column`   | `Column<TData, TValue>` | required | Table column         |
| `title`    | `string`                | —        | Filter display title |
| `options`  | `Option[]`              | required | Selectable options   |
| `multiple` | `boolean`               | —        | Allow multi-select   |

Single-select mode (`multiple` is `false` or `undefined`): clicking an option replaces the selection and closes the dropdown.

### `DataTableDateFilter`

```tsx
import { DataTableDateFilter } from "@labq-modules/ui/components/table/data-table-date-filter";

<DataTableDateFilter column={column} title="Created" multiple={false} />;
```

| Prop       | Type                     | Default  | Description            |
| ---------- | ------------------------ | -------- | ---------------------- |
| `column`   | `Column<TData, unknown>` | required | Table column           |
| `title`    | `string`                 | —        | Filter display title   |
| `multiple` | `boolean`                | —        | Enable date range mode |

### `DataTableSliderFilter`

```tsx
import { DataTableSliderFilter } from "@labq-modules/ui/components/table/data-table-slider-filter";

<DataTableSliderFilter column={column} title="Price" />;
```

Uses `column.columnDef.meta.range` as the default range, falling back to `getFacetedMinMaxValues()`.

### `DataTableSkeleton`

```tsx
import { DataTableSkeleton } from "@labq-modules/ui/components/table/data-table-skeleton";

<DataTableSkeleton
  columnCount={6}
  rowCount={10}
  filterCount={3}
  cellWidths={["12rem", "8rem", "8rem", "5rem", "8rem", "3rem"]}
  withViewOptions
  withPagination
  shrinkZero={false}
/>;
```

| Prop              | Type       | Default    | Description                                              |
| ----------------- | ---------- | ---------- | -------------------------------------------------------- |
| `columnCount`     | `number`   | required   | Number of column skeletons                               |
| `rowCount`        | `number`   | `10`       | Number of row skeletons                                  |
| `filterCount`     | `number`   | `0`        | Number of filter button skeletons                        |
| `cellWidths`      | `string[]` | `['auto']` | Width for each column (cycles if fewer than columnCount) |
| `withViewOptions` | `boolean`  | `true`     | Show view options skeleton                               |
| `withPagination`  | `boolean`  | `true`     | Show pagination controls skeleton                        |
| `shrinkZero`      | `boolean`  | `false`    | Set min-width on cells                                   |

---

## Advanced Usage

### Action Bar (Bulk Actions)

```tsx
<DataTable
  table={table}
  actionBar={
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm">
        Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
      </Button>
      <Button variant="outline" size="sm">
        Export
      </Button>
    </div>
  }
>
  <DataTableToolbar table={table} />
</DataTable>
```

The `actionBar` appears below the pagination only when at least one row is selected.

### Cell Actions (Row-Level)

Standard pattern with `DropdownMenu` + delete confirmation `Dialog`:

```tsx
function CellAction({ data }: { data: User }) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useMutation({
    ...deleteUserMutation,
    onSuccess: () => toast.success("Deleted"),
  });

  return (
    <>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{data.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(data.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <Icons.ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/users/${data.id}`)}>
            <Icons.edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <Icons.trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
```

### Advanced Filter (enableAdvancedFilter)

The `enableAdvancedFilter` prop disables the built-in column filter UI and lets you build a custom advanced filter UI. When enabled:

- `enableColumnFilter` is ignored
- `columnFilters` state is managed manually, not via nuqs
- You must render your own filter UI

### Custom Filter Operators

The config in `config/data-table.ts` defines operators per filter variant:

| Variant              | Available Operators                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `text`               | `iLike`, `notILike`, `eq`, `ne`, `isEmpty`, `isNotEmpty`                                        |
| `number` / `range`   | `eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `isBetween`, `isEmpty`, `isNotEmpty`                      |
| `date` / `dateRange` | `eq`, `ne`, `lt`, `gt`, `lte`, `gte`, `isBetween`, `isRelativeToToday`, `isEmpty`, `isNotEmpty` |
| `select`             | `eq`, `ne`, `isEmpty`, `isNotEmpty`                                                             |
| `multiSelect`        | `inArray`, `notInArray`, `isEmpty`, `isNotEmpty`                                                |
| `boolean`            | `eq`, `ne`                                                                                      |

---

## Type Reference

### From `@labq-modules/ui/types/data-table`

```tsx
interface ColumnMeta<TData, TValue> {
  label?: string;
  placeholder?: string;
  variant?:
    | "text"
    | "number"
    | "range"
    | "date"
    | "dateRange"
    | "boolean"
    | "select"
    | "multiSelect";
  options?: Option[];
  range?: [number, number];
  unit?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete";
}
```

### From `@labq-modules/ui/lib/parsers`

```tsx
// For use with nuqs — validates sort state from URL
const parser = getSortingStateParser<TData>(columnIds);

// For advanced filter — validates filter state from URL
const parser = getFiltersStateParser<TData>(columnIds);
```

---

## Exports

### From `@labq-modules/ui/components/table`

| Export                                                                                     | Description                |
| ------------------------------------------------------------------------------------------ | -------------------------- |
| `DataTable`                                                                                | Main table component       |
| `DataTableColumnHeader`                                                                    | Sortable column header     |
| `DataTablePagination`                                                                      | Page controls              |
| `DataTableToolbar`                                                                         | Filter toolbar             |
| `DataTableSkeleton`                                                                        | Loading skeleton           |
| `DataTableFacetedFilter`                                                                   | Multi/single select filter |
| `DataTableDateFilter`                                                                      | Date picker filter         |
| `DataTableSliderFilter`                                                                    | Range slider filter        |
| `DataTableViewOptions`                                                                     | Column visibility toggle   |
| `Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter` | Base table primitives      |

### From `@labq-modules/ui/hooks/use-data-table`

| Export         | Description                           |
| -------------- | ------------------------------------- |
| `useDataTable` | Hook: TanStack Table + nuqs URL state |

### From `@labq-modules/ui/lib/data-table`

| Export                     | Description                           |
| -------------------------- | ------------------------------------- |
| `getCommonPinningStyles`   | CSS for pinned columns                |
| `getFilterOperators`       | Get available operators for a variant |
| `getDefaultFilterOperator` | Get default operator for a variant    |
| `getValidFilters`          | Remove empty/invalid filters          |

### From `@labq-modules/ui/lib/parsers`

| Export                  | Description                           |
| ----------------------- | ------------------------------------- |
| `getSortingStateParser` | nuqs parser for sort state            |
| `getFiltersStateParser` | nuqs parser for advanced filter state |

### From `@labq-modules/ui/config/data-table`

| Export            | Description                                   |
| ----------------- | --------------------------------------------- |
| `dataTableConfig` | Operator definitions per variant, sort orders |

---

## Common Pitfalls

1. **`pageCount` is required**: Always pass the correct page count from your server response. Set to `-1` if you don't know the total (TanStack Table will show all rows as one page).

2. **`columnIds` for sort parser**: Pass a set of valid column IDs to `getSortingStateParser()` to prevent URL injection via sort state.

3. **Column filter search works differently with `useSuspenseQuery`**: Column filters set via `useDataTable` only modify `columnFilters` on the client. To also send filters to the server, read params from nuqs (`useQueryStates`) and include them in your query options. The column filter values sync to URL params automatically.

4. **Remove columns from URL when default**: Set `clearOnDefault: true` if you want the URL param to disappear when the filter is reset to its default (e.g., `page` goes back to 1).

5. **Always set `columnPinning` in `initialState`**: Use `initialState.columnPinning` rather than passing a separate `state` object. This avoids controlled/uncontrolled state conflicts.

6. **`DataTableSkeleton` columns must match `DataTable` columns**: The `columnCount` in the skeleton should match the number of visible columns in the real table. Use the `cellWidths` array to match column widths as closely as possible to prevent layout shift.

7. **`shallow: true` prevents RSC re-renders**: When using `shallow` (default), URL param changes don't re-fetch from the server — they only update client state. This is the correct behavior for table interactions (sort, filter, pagination) that use React Query. The server prefetch only happens on initial page load.

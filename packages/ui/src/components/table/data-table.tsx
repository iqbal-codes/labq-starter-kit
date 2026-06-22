import { type Table as TanstackTable, flexRender } from "@tanstack/react-table";
import type * as React from "react";

import { Icons } from "../icons";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTablePagination } from "./data-table-pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { getCommonPinningStyles } from "../../lib/data-table";
import { ScrollArea, ScrollBar } from "../scroll-area";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  onRowClick,
}: DataTableProps<TData>) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {children}
      <div className="flex min-h-[400px] flex-1 flex-col">
        <div className="flex flex-1 overflow-hidden rounded-2xl ring-1 ring-foreground/5 dark:ring-foreground/10">
          <ScrollArea className="h-full w-full">
            <Table>
              <TableHeader className="sticky top-0 z-10 border-b border-border/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          ...getCommonPinningStyles({ column: header.column }),
                        }}
                      >
                        {header.isPlaceholder ? null : typeof header.column.columnDef.header ===
                          "string" ? (
                          <DataTableColumnHeader
                            column={header.column}
                            title={header.column.columnDef.header}
                          />
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={onRowClick ? "cursor-pointer" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...getCommonPinningStyles({ column: cell.column }),
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getAllColumns().length} className="h-48">
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="rounded-full bg-muted p-3">
                          <Icons.inbox className="size-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">No results found</p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters to find what you're looking for.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <DataTablePagination table={table} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  );
}

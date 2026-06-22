"use client";

import type { Column, Table } from "@tanstack/react-table";
import * as React from "react";

import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableSliderFilter } from "./data-table-slider-filter";
import { DataTableViewOptions } from "./data-table-view-options";
import { Badge } from "../badge";
import { Button } from "../button";
import { Input } from "../input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { cn } from "../../lib/utils";
import { Icons } from "../icons";
import { Cross2Icon } from "@radix-ui/react-icons";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
}

const FILTER_VARIANTS: Record<string, true> = {
  number: true,
  range: true,
  date: true,
  dateRange: true,
  select: true,
  multiSelect: true,
  boolean: true,
};

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  const searchColumns = React.useMemo(
    () => columns.filter((column) => column.columnDef.meta?.variant === "text"),
    [columns],
  );

  const filterColumns = React.useMemo(
    () =>
      columns.filter((column) => {
        const variant = column.columnDef.meta?.variant;
        return variant && variant !== "text" && variant in FILTER_VARIANTS;
      }),
    [columns],
  );

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn("flex w-full items-start justify-between gap-2", className)}
      {...props}
    >
      {/* Left cluster: searchbar always visible, filter widgets inline on desktop */}
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {searchColumns.map((column) => (
          <ToolbarFilterRenderer key={column.id} column={column} />
        ))}

        {/* Desktop: inline filter widgets + reset */}
        {filterColumns.length > 0 && (
          <div className="hidden items-center gap-1.5 md:flex">
            {filterColumns.map((column) => (
              <ToolbarFilterRenderer key={column.id} column={column} />
            ))}
            {isFiltered && (
              <Button aria-label="Reset filters" variant="ghost" size="sm" onClick={onReset}>
                <Cross2Icon />
                Reset
              </Button>
            )}
          </div>
        )}

        {/* Mobile: filter trigger button */}
        {filterColumns.length > 0 && (
          <div className="flex items-center gap-1.5 md:hidden">
            <MobileFilterDialog
              filterColumns={filterColumns}
              isFiltered={isFiltered}
              onReset={onReset}
            />
          </div>
        )}
      </div>

      {/* Right cluster: children slot + view options */}
      <div className="flex items-center gap-1.5">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

// ── Filter trigger + dialog (mobile) ──────────────────────────────────────────

interface MobileFilterDialogProps<TData> {
  filterColumns: Column<TData>[];
  isFiltered: boolean;
  onReset: () => void;
}

function MobileFilterDialog<TData>({
  filterColumns,
  isFiltered,
  onReset,
}: MobileFilterDialogProps<TData>) {
  const [open, setOpen] = React.useState(false);

  const activeFilterCount = React.useMemo(() => {
    return filterColumns.filter((column) => {
      const value = column.getFilterValue();
      if (value === undefined || value === null) return false;
      if (typeof value === "string") return value.length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }).length;
  }, [filterColumns]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 border-dashed"
        onClick={() => setOpen(true)}
      >
        <Icons.plusCircle />
        Filter
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="px-1.5 font-normal">
            {activeFilterCount}
          </Badge>
        )}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            {filterColumns.length} filter{filterColumns.length !== 1 ? "s" : ""} available.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2 py-2">
          {filterColumns.map((column) => (
            <ToolbarFilterRenderer key={column.id} column={column} compact={false} />
          ))}
        </div>
        <DialogFooter>
          {isFiltered && (
            <Button aria-label="Reset filters" variant="ghost" size="sm" onClick={onReset}>
              <Cross2Icon />
              Reset
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// ── Per-column filter renderer ────────────────────────────────────────────────

interface ToolbarFilterRendererProps<TData> {
  column: Column<TData>;
  compact?: boolean;
}

function ToolbarFilterRenderer<TData>({
  column,
  compact = true,
}: ToolbarFilterRendererProps<TData>) {
  const columnMeta = column.columnDef.meta;

  const filterWidget = React.useCallback(() => {
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
      case "text":
        return (
          <Input
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="h-8 min-w-0 flex-1 md:w-40 md:flex-none lg:w-56"
          />
        );

      case "number":
        return (
          <div className="relative">
            <Input
              type="number"
              inputMode="numeric"
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
            />
            {columnMeta.unit && (
              <span className="bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm">
                {columnMeta.unit}
              </span>
            )}
          </div>
        );

      case "range":
        return <DataTableSliderFilter column={column} title={columnMeta.label ?? column.id} />;

      case "date":
      case "dateRange":
        return (
          <DataTableDateFilter
            column={column}
            title={columnMeta.label ?? column.id}
            multiple={columnMeta.variant === "dateRange"}
          />
        );

      case "select":
      case "multiSelect":
        return (
          <DataTableFacetedFilter
            column={column}
            title={columnMeta.label ?? column.id}
            options={columnMeta.options ?? []}
            multiple={columnMeta.variant === "multiSelect"}
            compact={compact}
          />
        );

      default:
        return null;
    }
  }, [column, columnMeta]);

  return filterWidget();
}

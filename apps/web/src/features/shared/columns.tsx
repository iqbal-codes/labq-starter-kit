import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@admin-template/ui/components/badge";
import { Button } from "@admin-template/ui/components/button";

type OptionItem = {
  value: string;
  label: string;
};

interface ActionsColumnConfig<TRow> {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (row: TRow) => void;
  onDelete: (row: TRow) => void;
}

export function actionsColumn<TRow>(config: ActionsColumnConfig<TRow>): ColumnDef<TRow> {
  return {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableHiding: false,
    size: 100,
    cell: ({ row }) => (
      <div className="flex gap-2">
        {config.canEdit && (
          <Button variant="ghost" size="sm" onClick={() => config.onEdit(row.original)}>
            Edit
          </Button>
        )}
        {config.canDelete && (
          <Button variant="ghost" size="sm" onClick={() => config.onDelete(row.original)}>
            Delete
          </Button>
        )}
      </div>
    ),
  };
}

export function badgeColumn<TRow extends object, TKey extends Extract<keyof TRow, string>>(
  key: TKey,
  label: string,
  options: OptionItem[],
  overrides?: Omit<ColumnDef<TRow>, "accessorKey" | "cell" | "header">,
): ColumnDef<TRow> {
  return {
    accessorKey: key,
    header: label,
    enableSorting: true,
    meta: {
      variant: "select",
      options,
      ...overrides?.meta,
    },
    ...overrides,
    cell: ({ row }) => {
      const original = row.original as TRow & Record<TKey, unknown>;
      const value = original[key];
      return <Badge variant="outline">{typeof value === "string" && value ? value : "—"}</Badge>;
    },
  };
}

export function lookupColumn<TRow extends object, TKey extends Extract<keyof TRow, string>>(
  key: TKey,
  label: string,
  lookupMap: Map<string, string>,
  overrides?: Omit<ColumnDef<TRow>, "accessorFn" | "header" | "id">,
): ColumnDef<TRow> {
  return {
    id: key,
    header: label,
    enableSorting: false,
    ...overrides,
    accessorFn: (row) => {
      const original = row as TRow & Record<TKey, unknown>;
      const value = original[key];
      if (typeof value !== "string" || !value) return "—";
      return lookupMap.get(value) ?? "—";
    },
  };
}

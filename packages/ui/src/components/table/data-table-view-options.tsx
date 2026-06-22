"use client";

import type { Table } from "@tanstack/react-table";
import { Icons } from "../icons";

import { Button } from "../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cn } from "../../lib/utils";
import * as React from "react";
import { CheckIcon, CaretSortIcon } from "@radix-ui/react-icons";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide()),
    [table],
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Toggle columns"
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 gap-1.5 lg:flex"
          />
        }
      >
        <Icons.adjustments />
        Columns
        <CaretSortIcon className="ml-auto opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                  className="gap-2"
                >
                  <span className="truncate flex-1">
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      column.getIsVisible() ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

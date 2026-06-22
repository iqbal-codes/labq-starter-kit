"use client";

import type { Column } from "@tanstack/react-table";
import { Icons } from "../icons";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { cn } from "../../lib/utils";
import { ChevronDownIcon, ChevronUpIcon, CaretSortIcon, Cross2Icon } from "@radix-ui/react-icons";

interface DataTableColumnHeaderProps<TData, TValue> extends React.ComponentProps<
  typeof DropdownMenuTrigger
> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "hover:bg-accent focus-visible:ring-ring/30 data-[state=open]:bg-accent -ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {title}
        {column.getCanSort() &&
          (column.getIsSorted() === "desc" ? (
            <ChevronDownIcon />
          ) : column.getIsSorted() === "asc" ? (
            <ChevronUpIcon />
          ) : (
            <CaretSortIcon />
          ))}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[7.5rem]">
        {column.getCanSort() && (
          <>
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "asc"}
              onClick={() => column.toggleSorting(false)}
            >
              <ChevronUpIcon />
              Asc
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "desc"}
              onClick={() => column.toggleSorting(true)}
            >
              <ChevronDownIcon />
              Desc
            </DropdownMenuCheckboxItem>
            {column.getIsSorted() && (
              <DropdownMenuItem
                className="[&_svg]:text-muted-foreground pl-2"
                onClick={() => column.clearSorting()}
              >
                <Cross2Icon />
                Reset
              </DropdownMenuItem>
            )}
          </>
        )}
        {column.getCanHide() && (
          <DropdownMenuCheckboxItem
            className="[&_svg]:text-muted-foreground relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
            checked={!column.getIsVisible()}
            onClick={() => column.toggleVisibility(false)}
          >
            <Icons.eyeOff />
            Hide
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Skeleton } from "../skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { cn } from "../../lib/utils";

interface DataTableSkeletonProps extends React.ComponentProps<"div"> {
  columnCount: number;
  rowCount?: number;
  filterCount?: number;
  cellWidths?: string[];
  withViewOptions?: boolean;
  withPagination?: boolean;
  shrinkZero?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  filterCount = 0,
  cellWidths = ["auto"],
  withViewOptions = true,
  withPagination = true,
  shrinkZero = false,
  className,
  ...props
}: DataTableSkeletonProps) {
  const cozyCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? "auto",
  );

  return (
    <div className={cn("flex flex-1 flex-col gap-4", className)} {...props}>
      <div className="flex w-full items-center justify-between gap-2 overflow-auto">
        <div className="flex flex-1 items-center gap-2">
          {filterCount > 0
            ? Array.from({ length: filterCount }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-[4.5rem] border-dashed" />
              ))
            : null}
        </div>
        {withViewOptions ? <Skeleton className="ml-auto hidden h-7 w-[4.5rem] lg:flex" /> : null}
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            {Array.from({ length: 1 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableHead
                    key={j}
                    style={{
                      width: cozyCellWidths[j],
                      minWidth: shrinkZero ? cozyCellWidths[j] : "auto",
                    }}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell
                    key={j}
                    style={{
                      width: cozyCellWidths[j],
                      minWidth: shrinkZero ? cozyCellWidths[j] : "auto",
                    }}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {withPagination ? (
        <div className="flex w-full items-center justify-between gap-4 overflow-auto p-1 sm:gap-6">
          <Skeleton className="h-7 w-36 shrink-0" />
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-[4.5rem]" />
            </div>
            <div className="flex items-center justify-center text-sm font-medium">
              <Skeleton className="h-7 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="hidden size-7 lg:block" />
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
              <Skeleton className="hidden size-7 lg:block" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

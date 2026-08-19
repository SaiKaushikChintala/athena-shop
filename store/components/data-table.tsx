"use client";

import { useState } from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyMessage?: string;
  filterColumn?: string;
  filterPlaceholder?: string;
  defaultSorting?: SortingState;
  pageSize?: number;
};

function metaClass<TData>(column: Column<TData, unknown>): string | undefined {
  return (column.columnDef.meta as { className?: string } | undefined)?.className;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }): React.ReactElement {
  if (sorted === "asc") return <ArrowUp className="size-3" />;
  if (sorted === "desc") return <ArrowDown className="size-3" />;
  return <ArrowUpDown className="size-3 opacity-40" />;
}

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = "No results.",
  filterColumn,
  filterPlaceholder = "Filter…",
  defaultSorting = [],
  pageSize = 10,
}: DataTableProps<TData>): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const table = useReactTable<TData>({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filter = filterColumn ? table.getColumn(filterColumn) : undefined;
  const filterValue = (filter?.getFilterValue() as string | undefined) ?? "";
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const rows = table.getRowModel().rows;

  function setFilter(value: string): void {
    filter?.setFilterValue(value);
    table.setPageIndex(0);
  }

  return (
    <div className="flex flex-col gap-4">
      {filter && (
        <InputGroup className="max-w-xs">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={filterPlaceholder}
            value={filterValue}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filterValue && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setFilter("")}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      )}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-muted/50 hover:bg-muted/50">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const label = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());

                  return (
                    <TableHead key={header.id} className={cn("eyebrow-tight whitespace-nowrap", metaClass(header.column))}>
                      {header.column.getCanSort() && !header.isPlaceholder ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "flex select-none items-center gap-1.5 uppercase transition-colors hover:text-foreground",
                            sorted && "text-foreground",
                          )}
                        >
                          {label}
                          <SortIcon sorted={sorted} />
                        </button>
                      ) : (
                        label
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-accent/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={metaClass(cell.column)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-28 text-balance text-center text-sm text-muted-foreground">
                  {filterValue ? `No matches for “${filterValue}”.` : emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(filter || pageCount > 1) && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs tabular-nums text-muted-foreground">
            {filteredCount === data.length
              ? `${data.length} row${data.length !== 1 ? "s" : ""}`
              : `${filteredCount} of ${data.length} rows`}
          </p>

          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Previous page"
                className="size-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft />
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {table.getState().pagination.pageIndex + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                aria-label="Next page"
                className="size-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

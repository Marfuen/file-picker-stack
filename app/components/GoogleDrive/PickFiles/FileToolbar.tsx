"use client";

import { FileToolbarProps } from "@/app/types/google-drive-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, SortDesc } from "lucide-react";

export function FileToolbar({
  sort,
  onSortChange,
  search,
  onSearchChange,
}: FileToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onSortChange(sort === "asc" ? "desc" : "asc")}
          >
            <SortDesc
              className={`w-4 h-4 transition-transform ${
                sort === "asc" ? "rotate-180" : ""
              }`}
            />
            Sort
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="relative w-1/3">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search"
          className="pl-8"
          value={search}
          onChange={onSearchChange}
        />
      </div>
    </div>
  );
}

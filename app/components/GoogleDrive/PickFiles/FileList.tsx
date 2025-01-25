"use client";

import { Button } from "@/components/ui/button";
import { Filter, Search, SortDesc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// const fakeFiles = [
//   { id: 1, name: "File 1", size: 1000 },
//   { id: 2, name: "File 2", size: 2000 },
//   { id: 3, name: "File 3", size: 3000 },
// ];

// interface FileListProps {
//   files: File[];
// }

export const FileList = () => {
  //   const [sort, setSort] = useState<"asc" | "desc">("asc");
  //   const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  return (
    <div className="flex flex-col gap-4">
      {/* Sort, Filter and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost">
              <SortDesc className="w-4 h-4" />
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TODO: Add file list */}
    </div>
  );
};

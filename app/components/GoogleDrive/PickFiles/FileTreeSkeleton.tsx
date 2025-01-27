"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { type ReactElement } from "react";

interface FileTreeSkeletonProps {
  depth: number;
}

export function FileTreeSkeleton({
  depth,
}: FileTreeSkeletonProps): ReactElement {
  return (
    <>
      {new Array(3).fill(1).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-1 md:gap-2 py-1 md:py-2 px-2 md:px-4 w-full"
          style={{ paddingLeft: (depth + 1) * 16 + "px" }}
        >
          <Skeleton className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
          <Skeleton className="h-3 md:h-4 flex-1 w-full" />
        </div>
      ))}
    </>
  );
}

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
          className="flex items-center gap-2 py-2 px-4 w-full"
          style={{ paddingLeft: (depth + 1) * 32 + "px" }}
        >
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 flex-1 w-full" />
        </div>
      ))}
    </>
  );
}

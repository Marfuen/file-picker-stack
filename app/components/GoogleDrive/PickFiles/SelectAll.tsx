"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface SelectAllProps {
  selectedCount: number;
  onSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
}

export const SelectAll = ({
  selectedCount,
  onSelectAll,
  isAllSelected,
}: SelectAllProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 py-1 px-2 rounded-sm"
          onClick={() => onSelectAll(!isAllSelected)}
        >
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(checked) => onSelectAll(checked === true)}
          />
          <p className="text-sm font-semibold select-none">Select all</p>
        </div>
        <div className="text-sm text-neutral-500">{selectedCount} selected</div>
      </div>
    </div>
  );
};

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
    <div className="flex flex-col gap-2 md:gap-4">
      <div className="flex items-center justify-between gap-1 md:gap-2">
        <div
          className="flex items-center gap-1 md:gap-2 cursor-pointer hover:bg-muted/50 py-1 px-1 md:px-2 rounded-sm"
          onClick={() => onSelectAll(!isAllSelected)}
        >
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(checked) => onSelectAll(checked === true)}
            className="h-3 w-3 md:h-4 md:w-4"
          />
          <p className="text-xs md:text-sm font-semibold select-none">
            Select all
          </p>
        </div>
        <div className="text-xs md:text-sm text-neutral-500">
          {selectedCount} selected
        </div>
      </div>
    </div>
  );
};

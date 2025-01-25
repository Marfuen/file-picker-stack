import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface SelectAllProps {
  selectedCount: number;
}

export const SelectAll = ({ selectedCount }: SelectAllProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <Checkbox />
          <p className="text-sm font-semibold">Select all</p>
        </div>
        <div className="text-sm text-neutral-500">{selectedCount}</div>
      </div>
      <Separator className="opacity-50" />
    </div>
  );
};

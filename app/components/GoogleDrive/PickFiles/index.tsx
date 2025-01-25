import { FileList } from "./FileList";
import { SelectAll } from "./SelectAll";

interface PickFilesProps {
  selectedCount: number;
}

export const PickFiles = ({ selectedCount }: PickFilesProps) => {
  return (
    <div className="flex flex-col gap-4">
      <SelectAll selectedCount={selectedCount} />
      <FileList />
    </div>
  );
};

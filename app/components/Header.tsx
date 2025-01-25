import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  title: string;
  isBeta?: boolean;
  icon: string;
}

export const Header: React.FC<HeaderProps> = ({ title, isBeta, icon }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image src={icon} alt={title} width={24} height={24} />
          <h5 className="text-xl font-bold">{title}</h5>
          {isBeta && (
            <div className="text-sm font-semibold bg-neutral-200 px-2 py-1 rounded-md">
              Beta
            </div>
          )}
        </div>
        <Button variant="secondary">
          <Plus className="w-4 h-4" />
          Add account
        </Button>
      </div>
      <Separator />
    </div>
  );
};

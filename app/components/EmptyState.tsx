import { Button } from "@/components/ui/button";

export const EmptyState = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <div className="flex flex-col gap-6 md:gap-8 items-center justify-center w-full py-8 md:py-16 px-4 md:px-6">
      <div className="flex flex-col gap-3 md:gap-4 items-center justify-center">
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Welcome to the Knowledge Base Wizard
        </h1>
        <p className="text-base md:text-lg max-w-sm md:max-w-2xl text-center text-muted-foreground">
          The steps are simple. First, you will select files from your Google
          Drive. Then, you will select the type of knowledge base you want to
          create.
        </p>
      </div>
      <Button onClick={onContinue} className="w-full md:w-auto">
        Get Started
      </Button>
    </div>
  );
};

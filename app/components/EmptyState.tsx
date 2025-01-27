import { Button } from "@/components/ui/button";

export const EmptyState = ({ onContinue }: { onContinue: () => void }) => {
  return (
    <div className="flex flex-col gap-8 items-center justify-center w-full py-16">
      <div className="flex flex-col gap-4 items-center justify-center">
        <h1 className="text-3xl font-bold">
          Welcome to the Knowledge Base Wizard
        </h1>
        <p className="text-lg max-w-2xl text-center">
          The steps are simple. First, you will select files from your Google
          Drive. Then, you will select the type of knowledge base you want to
          create.
        </p>
      </div>
      <Button onClick={onContinue}>Get Started</Button>
    </div>
  );
};

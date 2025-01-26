import { Header } from "./components/Header";
import { KnowledgeBaseWizard } from "./components/KnowledgeBaseWizard";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 p-16 max-w-screen-lg mx-auto">
      <div className="flex flex-col gap-6">
        <Header
          title="Google Drive"
          icon="/connections/drive-logo.svg"
          isBeta
        />
        <KnowledgeBaseWizard />
      </div>
    </div>
  );
}

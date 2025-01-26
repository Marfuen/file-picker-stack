"use client";

import { useEffect, useState } from "react";
import { PickFiles } from "../GoogleDrive/PickFiles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKnowledgeBase } from "@/app/hooks/useKnowledgeBase";
import { KnowledgeBaseView } from "@/app/components/KnowledgeBaseWizard/KnowledgeBaseView";

export function KnowledgeBaseWizard() {
  const [activeTab, setActiveTab] = useState<string>("select");
  const [isCreatingKnowledgeBase, setIsCreatingKnowledgeBase] = useState(false);
  const { getStoredKnowledgeBaseId } = useKnowledgeBase();
  const hasKnowledgeBase = getStoredKnowledgeBaseId() !== null;

  // If we have a knowledge base, start on the view tab
  useEffect(() => {
    if (hasKnowledgeBase) {
      setActiveTab("view");
    }
  }, [hasKnowledgeBase]);

  const handleCreateKnowledgeBase = async (callback: () => Promise<void>) => {
    setIsCreatingKnowledgeBase(true);
    try {
      await callback();
      setActiveTab("view");
    } finally {
      setIsCreatingKnowledgeBase(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="select">Select Files</TabsTrigger>
        <TabsTrigger value="view" disabled={!hasKnowledgeBase}>
          Knowledge Base
        </TabsTrigger>
      </TabsList>
      <TabsContent value="select" className="mt-4">
        <PickFiles
          onCreateKnowledgeBase={handleCreateKnowledgeBase}
          isCreatingKnowledgeBase={isCreatingKnowledgeBase}
        />
      </TabsContent>
      <TabsContent value="view" className="mt-4">
        <KnowledgeBaseView />
      </TabsContent>
    </Tabs>
  );
}

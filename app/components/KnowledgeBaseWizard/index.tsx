"use client";

import { useState } from "react";
import { PickFiles } from "../GoogleDrive/PickFiles";
import { EmptyState } from "@/app/components/EmptyState";

enum WizardStep {
  EMPTY_STATE = 1,
  PICK_FILES = 2,
}

export function KnowledgeBaseWizard() {
  const [isCreatingKnowledgeBase, setIsCreatingKnowledgeBase] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    WizardStep.EMPTY_STATE
  );

  const handleCreateKnowledgeBase = async (callback: () => Promise<void>) => {
    setIsCreatingKnowledgeBase(true);
    try {
      await callback();
    } finally {
      setIsCreatingKnowledgeBase(false);
    }
  };

  const handleContinue = () => {
    setCurrentStep(WizardStep.PICK_FILES);
  };

  // Show the appropriate step
  switch (currentStep) {
    case WizardStep.EMPTY_STATE:
      return <EmptyState onContinue={handleContinue} />;
    case WizardStep.PICK_FILES:
      return (
        <PickFiles
          onCreateKnowledgeBase={handleCreateKnowledgeBase}
          isCreatingKnowledgeBase={isCreatingKnowledgeBase}
        />
      );
  }
}

"use client";

interface KnowledgeBaseProviderProps {
  children: React.ReactNode;
}

export function KnowledgeBaseProvider({
  children,
}: KnowledgeBaseProviderProps) {
  return children;
}

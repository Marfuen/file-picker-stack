export interface KnowledgeBaseResponse {
  knowledge_base_id: string;
  organization_id: string;
  name: string;
  description: string;
  connection_id: string;
  connection_source_ids: string[];
  created_at: string;
  updated_at: string;
}

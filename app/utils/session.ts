"use server";

import { apiClient } from "./api-client";

export interface Session {
  orgId: string;
  connection?: {
    connectionId: string;
    name: string;
  };
}

export async function getSession(): Promise<Session> {
  // Get organization ID
  const { data: org } = await apiClient.get<{ org_id: string }>(
    "/organizations/me/current"
  );

  // Get Google Drive connection if exists
  const { data: connections } = await apiClient.get<
    {
      connection_id: string;
      name: string;
    }[]
  >(`/connections?connection_provider=gdrive&limit=1`);

  const [connection] = connections;

  // Return simple session object
  return {
    orgId: org.org_id,
    connection: connection
      ? {
          connectionId: connection.connection_id,
          name: connection.name,
        }
      : undefined,
  };
}

import { useEffect, useState } from "react";
import { apiClient } from "@/app/utils/api-client";

export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await apiClient.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        setError("Failed to initialize authentication");
      } finally {
        setIsLoading(false);
      }
    };

    if (!apiClient.isInitialized()) {
      initializeAuth();
    } else {
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    apiClient.clearSession();
    setIsInitialized(false);
  };

  return {
    isInitialized,
    isLoading,
    error,
    logout,
  };
}

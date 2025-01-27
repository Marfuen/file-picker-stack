"use server";

import axios from "axios";

if (!process.env.SUPABASE_AUTH_URL) {
  throw new Error("SUPABASE_AUTH_URL is not set");
}
if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_ANON_KEY is not set");
}
if (!process.env.EMAIL) {
  throw new Error("EMAIL is not set");
}
if (!process.env.PASSWORD) {
  throw new Error("PASSWORD is not set");
}

interface AuthCache {
  token: string;
  expiresAt: number;
}

let authCache: AuthCache | null = null;

export async function getAuthHeaders(): Promise<{ Authorization: string }> {
  // Check if we have a valid cached token
  if (authCache && authCache.expiresAt > Date.now()) {
    return {
      Authorization: `Bearer ${authCache.token}`,
    };
  }

  try {
    const response = await axios.post(
      `${process.env.SUPABASE_AUTH_URL}/auth/v1/token?grant_type=password`,
      {
        email: process.env.EMAIL!,
        password: process.env.PASSWORD!,
        gotrue_meta_security: {},
      },
      {
        headers: {
          "Content-Type": "application/json",
          Apikey: process.env.SUPABASE_ANON_KEY!,
        },
      }
    );

    // Cache the token with expiration (subtract 5 minutes for safety)
    authCache = {
      token: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1000 - 5 * 60 * 1000,
    };

    return {
      Authorization: `Bearer ${response.data.access_token}`,
    };
  } catch (error) {
    console.error("[getAuthHeaders] Authentication failed:", error);
    if (axios.isAxiosError(error)) {
      console.error("[getAuthHeaders] Response data:", error.response?.data);
      console.error(
        "[getAuthHeaders] Response status:",
        error.response?.status
      );
    }
    throw new Error("Authentication failed");
  }
}

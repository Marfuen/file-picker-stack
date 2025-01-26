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

export async function getAuthHeaders(): Promise<{ Authorization: string }> {
  console.log("[getAuthHeaders] Starting authentication process");

  try {
    console.log("[getAuthHeaders] Making authentication request to Supabase");
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

    console.log("[getAuthHeaders] Authentication successful");
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

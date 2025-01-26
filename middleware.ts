import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiClient } from "@/app/utils/api-client";

const AUTH_TOKEN_KEY = "auth_token";

export async function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;
  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Initialize API client with the token
    await apiClient.initialize();

    // If initialization succeeds, continue to the API route
    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Authentication error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: "/api/:path*",
};

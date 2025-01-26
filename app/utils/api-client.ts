import axios, { AxiosInstance } from "axios";
import { getAuthHeaders } from "./auth";
import Cookies from "js-cookie";

const BACKEND_URL = "https://api.stack-ai.com";
const AUTH_TOKEN_KEY = "auth_token";

class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private initialized: boolean = false;

  private constructor() {
    this.client = axios.create({
      baseURL: BACKEND_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add response interceptor to handle token expiration
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear it
          Cookies.remove(AUTH_TOKEN_KEY);
          this.initialized = false;

          // Try to reinitialize and retry the request
          await this.initialize();
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(AUTH_TOKEN_KEY) || null;
  }

  private setStoredToken(token: string) {
    if (typeof window === "undefined") return;
    // Set cookie with secure flag and same-site attribute
    Cookies.set(AUTH_TOKEN_KEY, token, {
      secure: true,
      sameSite: "strict",
      // Expire in 30 days
      expires: 30,
    });
  }

  public async initialize() {
    // Check if we already have a valid token
    const storedToken = this.getStoredToken();
    if (storedToken) {
      this.client.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      this.initialized = true;
      return;
    }

    // Get new auth headers
    const authHeaders = await getAuthHeaders();
    const token = authHeaders.Authorization.replace("Bearer ", "");

    // Store the token
    this.setStoredToken(token);

    // Set headers
    this.client.defaults.headers.common = {
      ...this.client.defaults.headers.common,
      ...authHeaders,
    };

    this.initialized = true;
  }

  public async get<T>(url: string, config = {}) {
    await this.initialize();
    return this.client.get<T>(url, config);
  }

  public async post<T>(url: string, data = {}, config = {}) {
    await this.initialize();
    return this.client.post<T>(url, data, config);
  }

  public async put<T>(url: string, data = {}, config = {}) {
    await this.initialize();
    return this.client.put<T>(url, data, config);
  }

  public async delete<T>(url: string, config = {}) {
    await this.initialize();
    return this.client.delete<T>(url, config);
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public clearSession() {
    Cookies.remove(AUTH_TOKEN_KEY);
    this.initialized = false;
  }
}

// Export a singleton instance
export const apiClient = ApiClient.getInstance();

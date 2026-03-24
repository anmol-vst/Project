import type { ApiEnvelope } from "../types/api";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
let token = "";

export const setHttpToken = (nextToken: string) => {
  token = nextToken;
};

const buildQuery = (params?: Record<string, string | number | boolean | undefined>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export async function http<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    params?: Record<string, string | number | boolean | undefined>;
    json?: unknown;
  } = {}
): Promise<T> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}${buildQuery(options.params)}`, {
    method: options.method || "GET",
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
  });

  const text = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      if (!response.ok) {
        throw new Error(`Request failed (${response.status}). Backend returned non-JSON response.`);
      }
      throw new Error("Received invalid server response.");
    }
  }

  if (!response.ok || !payload?.success) {
    const maybePayload = payload as (ApiEnvelope<T> & { errors?: Array<{ field: string; message: string }> }) | null;
    const fieldErrors = maybePayload?.errors ?? [];
    const details = fieldErrors
      .map((item) => `${item.field}: ${item.message}`)
      .join(", ");
    throw new Error(maybePayload?.message || details || "Request failed");
  }
  return payload.data as T;
}

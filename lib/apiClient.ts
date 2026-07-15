const API_VER = "/api/v1";
export const BASE_URL = "https://your-backend.com" + API_VER;

type ApiOptions = RequestInit & {
  params?: Record<string, string | number | boolean>;
};
export async function apiClient<T>(
  endpoint: string,
  options?: ApiOptions,
): Promise<T> {
  const { params, ...fetchOptions } = options || {};

  const url = new URL(endpoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Network error" }));
    throw new Error(error.message || "Something went wrong");
  }

  return response.json();
}

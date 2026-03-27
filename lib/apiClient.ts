const API_VER = "/api/v1";
// export const BASE_URL = "http://192.168.1.14:8000" + API_VER;
// export const BASE_URL = 'http://192.168.43.174:8000' + API_VER;
export const BASE_URL = "https://mangako-api.vercel.app" + API_VER;

type ApiOptions = RequestInit & {
  params?: Record<string, string | number | boolean>;
};
export async function apiClient<T>(
  endpoint: string,
  options?: ApiOptions,
): Promise<T> {
  const { params, ...fetchOptions } = options || {};

  // 1. Robust URL Construction
  // Using URL object handles trailing slashes and complex characters automatically
  const url = new URL(endpoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    // fetchOptions.signal is automatically included here via the spread
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

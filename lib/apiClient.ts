const API_VER = "/api/v1";
// export const BASE_URL = "http://192.168.1.14:8000" + API_VER;
// export const BASE_URL = 'http://192.168.43.174:8000' + API_VER;
export const BASE_URL = "https://mangako-api.vercel.app" + API_VER;

type ApiOptions = RequestInit & {
  params?: Record<string, string | number | boolean>;
};

export async function apiClient<T>(
  endpoint: string,
  options?: ApiOptions, // Use the extended type here
): Promise<T> {
  const { params, ...fetchOptions } = options || {};

  // Construct the URL with query parameters
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams(params as any).toString();
    url = `${endpoint}?${searchParams}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: { "Content-Type": "application/json", ...fetchOptions?.headers },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Network error" }));
    throw new Error(error.message || "Something went wrong");
  }

  return response.json();
}

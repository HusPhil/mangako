const API_VER = "/api/v1";
// export const BASE_URL = "http://192.168.1.14:8000" + API_VER;
// export const BASE_URL = 'http://192.168.43.174:8000' + API_VER;
export const BASE_URL = "https://mangako-api.vercel.app" + API_VER;

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Network error" }));
    throw new Error(error.message || "Something went wrong");
  }

  return response.json();
}

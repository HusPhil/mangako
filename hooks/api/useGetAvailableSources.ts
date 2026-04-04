import { apiClient, BASE_URL } from "@/lib/apiClient";
import { Source } from "@/types/ResponseTypes";
import { useQuery } from "@tanstack/react-query";

export const fetchSources = async (signal?: AbortSignal): Promise<Source[]> => {
  const url = `${BASE_URL}/scrape/sources`;

  return await apiClient<Source[]>(url, {
    signal,
    headers: {
      Connection: "close",
    },
  });
};

export const useGetAvailableSources = () => {
  return useQuery({
    queryKey: ["manga", "sources"] as const,
    queryFn: ({ signal }) => fetchSources(signal),
    staleTime: 1000 * 60 * 60, // Consider fresh for 1 hour
    cacheTime: 1000 * 60 * 30, // Cache for 30 minutes to allow quick refetches without hitting the network every time
    refetchOnWindowFocus: false,
    refetchOnReconnect: "always",
    retry: 2,
  });
};

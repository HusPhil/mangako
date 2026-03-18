import { apiClient, BASE_URL } from "@/lib/apiClient";
import { LatestMangaListResponse } from "@/types/ResponseTypes";
import { useQuery } from "@tanstack/react-query";

export const getLatestMangaList = async ({
  source,
  page = 1,
}: {
  source: string;
  page?: number;
}): Promise<LatestMangaListResponse> => {
  // Ensure BASE_URL doesn't end with a slash if your path starts with one
  // Or just use the URL constructor for ultimate safety:
  const url = `${BASE_URL}/${source}/manga/latest/${page}`;
  return await apiClient<LatestMangaListResponse>(url);
};

export const useGetLatestMangaList = (source: string, page: number = 1) => {
  return useQuery({
    queryKey: [source, "manga", "latest", page] as const,
    queryFn: () => getLatestMangaList({ source, page }),
    enabled: !!source, // Don't run if source is missing
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

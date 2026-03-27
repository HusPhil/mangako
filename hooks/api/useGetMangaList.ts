import { apiClient, BASE_URL } from "@/lib/apiClient";
import { LatestMangaListResponse } from "@/types/ResponseTypes";
import { useQuery } from "@tanstack/react-query";

export const getLatestMangaList = async ({
  source,
  page = 1,
  signal,
}: {
  source: string;
  page?: number;
  signal?: AbortSignal;
}): Promise<LatestMangaListResponse> => {
  const url = `${BASE_URL}/${source}/manga/latest/${page}`;
  return await apiClient<LatestMangaListResponse>(url, { signal });
};

export const useGetLatestMangaList = (source: string, page: number = 1) => {
  return useQuery({
    queryKey: ["manga", "latest", source, page] as const,
    queryFn: ({ signal }) => getLatestMangaList({ source, page, signal }),
    enabled: !!source,
    staleTime: 1000 * 60 * 5, // 5 minutes is standard for "Latest" feeds
    refetchOnWindowFocus: false,
  });
};

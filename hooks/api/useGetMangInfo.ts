import { apiClient, BASE_URL } from "@/lib/apiClient";
import { MangaInfoResponse } from "@/types/ResponseTypes";
import { useQuery } from "@tanstack/react-query";

export const getMangaInfo = async (
  source: string,
  mangaUrl: string,
  signal?: AbortSignal,
): Promise<MangaInfoResponse> => {
  return await apiClient<MangaInfoResponse>(
    `${BASE_URL}/${source}/manga/info`,
    {
      params: { url: mangaUrl },
      signal,
    },
  );
};

export const useGetMangaInfo = (source: string, mangaUrl?: string) => {
  return useQuery({
    queryKey: ["manga", "info", source, mangaUrl] as const,
    queryFn: ({ signal }) => {
      if (!mangaUrl) throw new Error("Manga URL is required");
      return getMangaInfo(source, mangaUrl, signal);
    },
    enabled: !!source && !!mangaUrl, // Critical: prevent empty fetches
    staleTime: 1000 * 60 * 5, // Cache info for 15 mins
  });
};

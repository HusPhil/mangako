import { apiClient, BASE_URL } from "@/lib/apiClient";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { useQuery } from "@tanstack/react-query";

export const fetchChapterPages = async (
  source: string,
  chapterUrl: string,
  signal?: AbortSignal, // Added signal support
): Promise<MangaChapterPage[]> => {
  const url = `${BASE_URL}/${source}/manga/chapter/pages`;

  return await apiClient<MangaChapterPage[]>(url, {
    params: { url: chapterUrl },
    signal, // Pass signal to fetch
    headers: {
      Connection: "close", // Prevent Android socket hangs
    },
  });
};

export const useGetChapterPages = (source: string, chapterUrl?: string) => {
  return useQuery({
    queryKey: ["chapter-pages", source, chapterUrl] as const,
    queryFn: ({ signal }) => {
      if (!chapterUrl) throw new Error("Chapter URL is required");
      return fetchChapterPages(source, chapterUrl, signal);
    },
    enabled: !!source && !!chapterUrl,

    staleTime: Infinity, // Chapter images are static; never go stale
    cacheTime: 1000 * 60 * 1,
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: "always",
  });
};

import { useQuery } from "@tanstack/react-query";
import { axiosInstance, BASE_URL } from "./axios/axiosInstance";

// Schema for a single manga chapter page
export interface MangaChapterPage {
  pageId: string;
  pageUrl: string;
  pageImageUrl: string;
  pageHeight: number;
  pageWidth: number;
}

// Fetcher function that calls your backend endpoint
const fetchChapterPages = async (source: string, url: string): Promise<MangaChapterPage[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/${source}/manga/chapter/pages`, {
    params: { url },
  });
  return response.data;
};

// Hook
export const useGetChapterPages = (source: string, url?: string) => {
  return useQuery<MangaChapterPage[]>({
    queryKey: ["chapter-pages", source, url],
    queryFn: () => fetchChapterPages(source, url!),
    enabled: !!url, // Only run query if `url` is provided
    refetchOnWindowFocus: false,
  });
};

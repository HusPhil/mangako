import { apiClient, BASE_URL } from "@/lib/apiClient";
import { MangaSearchResponse } from "@/types/ResponseTypes";
import { useMutation } from "@tanstack/react-query";

// Standard GET function
export const getSearchedManga = async ({
  source,
  keyword,
  signal,
}: {
  source: string;
  keyword: string;
  signal?: AbortSignal;
}): Promise<MangaSearchResponse> => {
  // Construct the URL with the query parameter securely
  const url = `${BASE_URL}/${source}/manga/search?keyword=${encodeURIComponent(keyword)}`;

  return await apiClient<MangaSearchResponse>(url, { signal });
};

// Manually triggered search using useMutation
export const useSearchMangaMutation = () => {
  return useMutation({
    mutationFn: ({ source, keyword }: { source: string; keyword: string }) =>
      getSearchedManga({ source, keyword }),
  });
};

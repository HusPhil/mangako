import { apiClient, BASE_URL } from "@/lib/apiClient";
import { MangaInfoResponse } from "@/types/ResponseTypes";
import { useQuery } from "@tanstack/react-query";

export const getMangaInfo = async (
  source: string,
  mangaUrl: string,
): Promise<MangaInfoResponse> => {
  const response = apiClient<MangaInfoResponse>(
    `${BASE_URL}/${source}/manga/info`,
    {
      params: {
        url: mangaUrl,
      },
    },
  );
  return response;
};

export const useGetMangaInfo = (source: string, mangaUrl: string) => {
  return useQuery<MangaInfoResponse>({
    queryKey: ["manga", "info", mangaUrl],
    queryFn: () => getMangaInfo(source, mangaUrl),
  });
};

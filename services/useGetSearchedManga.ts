import { useMutation } from "@tanstack/react-query";
import { axiosInstance, BASE_URL } from "./axios/axiosInstance";
import { MangaInfoResponse } from "./ResponseTypes";

// Standard GET function
export const getSearchedManga = async (
  source: string,
  keyword: string
): Promise<MangaInfoResponse> => {
  const { data: response } = await axiosInstance.get(`${BASE_URL}/${source}/manga/search`, {
    params: { keyword },
  });
  return response;
};

// Manually triggered search using useMutation
export const useSearchMangaMutation = () => {
  return useMutation({
    mutationFn: ({ source, keyword }: { source: string; keyword: string }) =>
      getSearchedManga(source, keyword),
  });
};

import {
  useInfiniteQuery,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { axiosInstance, BASE_URL } from "./axios/axiosInstance";

interface Manga {
  mangaId: string;
  mangaTitle: string;
  mangaUrl: string;
  mangaCover: string;
}

export interface LatestMangaListResponse {
  source: string;
  latest_manga: Manga[];
}

export interface PopularMangaListResponse {
  source: string;
  popular_manga: Manga[];
}

export const getLatestMangaList = async ({
  source,
  page = 1,
}: {
  source: string;
  page: number;
}): Promise<LatestMangaListResponse> => {
  const { data: response } = await axiosInstance.get(
    BASE_URL + `/${source}/manga/latest/${page}`
  );

  return response; // Contains latest_manga and popular_manga
};

export const useGetLatestMangaList = (source: string) => {
  return useInfiniteQuery<
    LatestMangaListResponse,
    Error,
    LatestMangaListResponse,
    [string, string, string],
    number
  >({
    queryKey: [source, "manga", "latest"],
    queryFn: ({ pageParam }) => getLatestMangaList({ source, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.latest_manga.length === 0) return undefined;
      return allPages.length + 1;
    },
  });
};

export const getPopularMangaList = async ({
  source,
}: {
  source: string;
}): Promise<PopularMangaListResponse> => {
  const { data: response } = await axiosInstance.get(
    BASE_URL + `/${source}/manga/popular`
  );

  return response; // Contains latest_manga and popular_manga
};

export const useGetPopularMangaList = (
  source: string
): UseQueryResult<PopularMangaListResponse> => {
  return useQuery({
    queryKey: [source, "manga", "popular"],
    queryFn: () => getPopularMangaList({ source }),
  });
};

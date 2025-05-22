import { useQuery } from "@tanstack/react-query";
import { axiosInstance, BASE_URL } from "./axios/axiosInstance";
import { MangaInfoResponse } from "./ResponseTypes";


export const getMangaInfo = async (source: string, mangaUrl: string): Promise<MangaInfoResponse> => {
    const { data: response } = await axiosInstance.get(`${BASE_URL}/${source}/manga/info`, {
        params: {
            url: mangaUrl
        }
    });
    return response;
};


export const useGetMangaInfo = (source: string, mangaUrl: string) => {
    return useQuery<MangaInfoResponse>({
        queryKey: ['manga', 'info', mangaUrl],
        queryFn: () => getMangaInfo(source, mangaUrl),
    });
};


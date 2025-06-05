import { useQuery } from "@tanstack/react-query";
import { axiosInstance, BASE_URL } from "./axios/axiosInstance";
import { Source } from "./ResponseTypes";

// Schema for a single manga chapter page

// Fetcher function that calls your backend endpoint
const fetchSources = async (): Promise<Source[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/scrape/sources`);
  if (!response.data || !Array.isArray(response.data)) {
    throw new Error("Invalid response from the server");
  }
  console.log("Available sources:", response.data);
  return response.data;
};

// Hook
export const useGetAvailableSources = () => {
  return useQuery<Source[]>({
    queryKey: ["manga", "sources"],
    queryFn: () => fetchSources(),
    refetchOnWindowFocus: false,
  });
};

import { Podcast } from "../types/podcast";
import axios from "axios";
import useSWR from "swr";

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

const fetcher = (url: string) =>
  axios.get(url).then((res) => res.data.data as Podcast[]);

export const usePodcasts = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${STRAPI_URL}/api/podcasts?populate=*`,
    fetcher
  );

  return {
    podcasts: data,
    error,
    isLoading,
    refetch: mutate,
  };
};

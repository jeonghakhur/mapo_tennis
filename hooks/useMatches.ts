import useSWR from 'swr';
import type { Match } from '@/types/tournament';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMatches(tournamentId: string | null, division: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Match[]>(
    tournamentId && division
      ? `/api/tournament-grouping/matches?tournamentId=${tournamentId}&division=${division}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    matches: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

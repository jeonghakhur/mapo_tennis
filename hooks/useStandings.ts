import useSWR from 'swr';
import type { GroupStanding } from '@/types/tournament';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useStandings(tournamentId: string | null, division: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: GroupStanding[] }>(
    tournamentId && division
      ? `/api/tournament-grouping/standings?tournamentId=${tournamentId}&division=${division}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    standings: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

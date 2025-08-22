import useSWR from 'swr';
import type { Group } from '@/types/tournament';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface GroupsResponse {
  groups: Group[];
  totalGroups: number;
  teamsPerGroup: number;
  remainingTeams: number;
  distribution: {
    groupsWith3Teams: number;
    groupsWith2Teams: number;
  };
}

export function useGroups(tournamentId: string | null, division: string | null) {
  const { data, error, isLoading, mutate } = useSWR<GroupsResponse>(
    tournamentId && division
      ? `/api/tournament-grouping/groups?tournamentId=${tournamentId}&division=${division}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // 조 이름 매핑 생성
  const groupNameMap: Record<string, string> = {};
  data?.groups?.forEach((group) => {
    groupNameMap[group.groupId] = group.name;
  });

  return {
    groups: data?.groups || [],
    groupNameMap,
    totalGroups: data?.totalGroups || 0,
    teamsPerGroup: data?.teamsPerGroup || 0,
    remainingTeams: data?.remainingTeams || 0,
    distribution: data?.distribution || { groupsWith3Teams: 0, groupsWith2Teams: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

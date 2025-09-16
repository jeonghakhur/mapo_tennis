'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Badge } from '@radix-ui/themes';
import { Plus, Trash2 } from 'lucide-react';
import type { Team, Group } from '@/types/tournament';
import { Combobox } from '@/components/ui/combobox';

interface ManualGroupingProps {
  teams: Team[];
  onGroupsChange: (groups: Group[]) => void;
  teamsPerGroup: number;
}

interface DraggedTeam {
  team: Team;
  sourceGroupId?: string;
}

export default function ManualGrouping({
  teams,
  onGroupsChange,
  teamsPerGroup,
}: ManualGroupingProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [draggedTeam, setDraggedTeam] = useState<DraggedTeam | null>(null);
  const [unassignedTeams, setUnassignedTeams] = useState<Team[]>([]);
  const [selectedTeamForGroup, setSelectedTeamForGroup] = useState<{ [groupId: string]: string }>(
    {},
  );

  // 초기 그룹 생성 및 자동 배정
  useEffect(() => {
    const totalGroups = Math.ceil(teams.length / teamsPerGroup);
    const initialGroups: Group[] = [];

    for (let i = 0; i < totalGroups; i++) {
      // const groupId = `group_${String.fromCharCode(65 + i)}`;
      const groupId = `group_${String(i + 1)}`;
      const groupName = `${String(i + 1)}조`;

      initialGroups.push({
        groupId,
        name: groupName,
        teams: [],
        division: teams[0]?.division || '',
      });
    }

    setGroups(initialGroups);
    // 선택된 팀 상태도 초기화
    setSelectedTeamForGroup({});

    // 자동 배정 실행
    if (teams.length > 0) {
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      const newGroups = [...initialGroups];
      const newUnassignedTeams: Team[] = [];

      // 시드가 있는 팀들과 없는 팀들을 분리하고 시드 순서대로 정렬
      const seededTeams = shuffledTeams.filter((team) => team.seed && team.seed > 0);
      const nonSeededTeams = shuffledTeams.filter((team) => !team.seed || team.seed === 0);

      // 시드가 있는 팀들을 시드 번호 순서대로 각 조에 분산 배정
      seededTeams.forEach((team, index) => {
        const groupIndex = index % newGroups.length;
        if (groupIndex < newGroups.length && newGroups[groupIndex].teams.length < teamsPerGroup) {
          newGroups[groupIndex].teams.push(team);
        } else {
          newUnassignedTeams.push(team);
        }
      });

      // 시드가 없는 팀들을 나머지 공간에 배정
      nonSeededTeams.forEach((team) => {
        // 가장 적은 팀이 있는 조를 찾아서 배정
        let targetGroupIndex = 0;
        let minTeamCount = newGroups[0].teams.length;

        for (let i = 1; i < newGroups.length; i++) {
          if (newGroups[i].teams.length < minTeamCount) {
            minTeamCount = newGroups[i].teams.length;
            targetGroupIndex = i;
          }
        }

        // 조당 최대 팀 수를 초과하지 않는 경우에만 배정
        if (newGroups[targetGroupIndex].teams.length < teamsPerGroup) {
          newGroups[targetGroupIndex].teams.push(team);
        } else {
          newUnassignedTeams.push(team);
        }
      });
      console.log('newGroups', newGroups);
      setGroups(newGroups);
      setUnassignedTeams(newUnassignedTeams);
    } else {
      setUnassignedTeams([...teams]);
    }
  }, [teams, teamsPerGroup, teams.length]);

  // 그룹 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    const allGroups = [...groups];
    onGroupsChange(allGroups);
  }, [groups, onGroupsChange]);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, team: Team, sourceGroupId?: string) => {
    setDraggedTeam({ team, sourceGroupId });
    e.dataTransfer.effectAllowed = 'move';
  };

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent, team: Team, sourceGroupId?: string) => {
    setDraggedTeam({ team, sourceGroupId });
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();

    if (!draggedTeam) return;

    const { team, sourceGroupId } = draggedTeam;

    // 같은 그룹으로 드롭하는 경우 순서 조정
    if (sourceGroupId === targetGroupId) {
      // 드롭 위치에 따른 순서 조정
      const dropIndex = getDropIndex(e, targetGroupId);
      if (dropIndex !== -1) {
        setGroups((prevGroups) =>
          prevGroups.map((group) => {
            if (group.groupId === targetGroupId) {
              const teams = [...group.teams];
              const currentIndex = teams.findIndex((t) => t._id === team._id);

              // 현재 위치에서 제거
              teams.splice(currentIndex, 1);
              // 새로운 위치에 삽입
              teams.splice(dropIndex, 0, team);

              return { ...group, teams };
            }
            return group;
          }),
        );
      }
      setDraggedTeam(null);
      return;
    }

    // 소스 그룹에서 팀 제거
    if (sourceGroupId) {
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.groupId === sourceGroupId
            ? { ...group, teams: group.teams.filter((t) => t._id !== team._id) }
            : group,
        ),
      );
    } else {
      // 미배정 팀에서 제거
      setUnassignedTeams((prev) => prev.filter((t) => t._id !== team._id));
    }

    // 타겟 그룹에 팀 추가
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.groupId === targetGroupId ? { ...group, teams: [...group.teams, team] } : group,
      ),
    );

    setDraggedTeam(null);
  };

  // 드롭 위치에 따른 인덱스 계산
  const getDropIndex = (e: React.DragEvent, groupId: string) => {
    const group = groups.find((g) => g.groupId === groupId);
    if (!group || group.teams.length === 0) return 0;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const itemHeight = rect.height / group.teams.length;
    const dropIndex = Math.floor(relativeY / itemHeight);

    return Math.min(Math.max(0, dropIndex), group.teams.length);
  };

  // 터치 드롭
  const handleTouchDrop = (e: React.TouchEvent, targetGroupId: string) => {
    e.preventDefault();

    if (!draggedTeam) return;

    const { team, sourceGroupId } = draggedTeam;

    // 같은 그룹으로 드롭하는 경우 순서 조정
    if (sourceGroupId === targetGroupId) {
      // 터치 드롭의 경우 마지막 위치에 추가 (순서 조정은 드래그로만)
      setDraggedTeam(null);
      return;
    }

    // 소스 그룹에서 팀 제거
    if (sourceGroupId) {
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.groupId === sourceGroupId
            ? { ...group, teams: group.teams.filter((t) => t._id !== team._id) }
            : group,
        ),
      );
    } else {
      // 미배정 팀에서 제거
      setUnassignedTeams((prev) => prev.filter((t) => t._id !== team._id));
    }

    // 타겟 그룹에 팀 추가
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.groupId === targetGroupId ? { ...group, teams: [...group.teams, team] } : group,
      ),
    );

    setDraggedTeam(null);
  };

  // 자동 배정
  const handleAutoAssign = () => {
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    const newGroups = [...groups];
    const newUnassignedTeams: Team[] = [];

    // 모든 그룹 초기화
    newGroups.forEach((group) => {
      group.teams = [];
    });

    // 시드가 있는 팀들과 없는 팀들을 분리
    const seededTeams = shuffledTeams.filter((team) => team.seed && team.seed > 0);
    const nonSeededTeams = shuffledTeams.filter((team) => !team.seed || team.seed === 0);

    // 시드가 있는 팀들을 먼저 각 조에 분산 배정
    seededTeams.forEach((team, index) => {
      const groupIndex = index % newGroups.length;
      if (groupIndex < newGroups.length && newGroups[groupIndex].teams.length < teamsPerGroup) {
        newGroups[groupIndex].teams.push(team);
      } else {
        newUnassignedTeams.push(team);
      }
    });

    // 시드가 없는 팀들을 나머지 공간에 배정
    nonSeededTeams.forEach((team) => {
      // 가장 적은 팀이 있는 조를 찾아서 배정
      let targetGroupIndex = 0;
      let minTeamCount = newGroups[0].teams.length;

      for (let i = 1; i < newGroups.length; i++) {
        if (newGroups[i].teams.length < minTeamCount) {
          minTeamCount = newGroups[i].teams.length;
          targetGroupIndex = i;
        }
      }

      // 조당 최대 팀 수를 초과하지 않는 경우에만 배정
      if (newGroups[targetGroupIndex].teams.length < teamsPerGroup) {
        newGroups[targetGroupIndex].teams.push(team);
      } else {
        newUnassignedTeams.push(team);
      }
    });

    setGroups(newGroups);
    setUnassignedTeams(newUnassignedTeams);
  };

  // 모든 팀 초기화
  const handleReset = () => {
    setGroups((prevGroups) => prevGroups.map((group) => ({ ...group, teams: [] })));
    setUnassignedTeams([...teams]);
  };

  // 팀 삭제 (조에서 제거하여 미배정으로 이동)
  const handleDeleteTeam = (team: Team, groupId: string) => {
    // 조에서 제거
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.groupId === groupId
          ? { ...group, teams: group.teams.filter((t) => t._id !== team._id) }
          : group,
      ),
    );

    // 미배정으로 이동 (중복 추가 방지)
    setUnassignedTeams((prev) => (prev.some((t) => t._id === team._id) ? prev : [...prev, team]));
  };

  // 팀 추가
  const handleAddTeam = (groupId: string) => {
    const selectedTeamId = selectedTeamForGroup[groupId];

    if (!selectedTeamId || unassignedTeams.length === 0) return;

    // 선택된 팀을 찾아서 조에 추가
    const teamToAdd = unassignedTeams.find((team) => team._id === selectedTeamId);
    if (!teamToAdd) return;

    // 조에 팀 추가
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.groupId === groupId ? { ...group, teams: [...group.teams, teamToAdd] } : group,
      ),
    );

    // 미배정 팀에서 제거
    setUnassignedTeams((prev) => prev.filter((team) => team._id !== selectedTeamId));

    // 선택 상태 초기화
    setSelectedTeamForGroup((prev) => ({ ...prev, [groupId]: '' }));
  };

  // 팀 선택 변경
  const handleTeamSelectionChange = (groupId: string, teamId: string) => {
    setSelectedTeamForGroup((prev) => ({ ...prev, [groupId]: teamId }));
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Heading size="4">조편성 ({groups.length}조)</Heading>
        <Flex gap="2">
          <Button size="2" variant="soft" onClick={handleAutoAssign}>
            자동 배정
          </Button>
          <Button size="2" variant="soft" color="red" onClick={handleReset}>
            초기화
          </Button>
        </Flex>
      </Flex>

      <Flex direction="column" gap="4">
        {/* 조별 영역 */}
        <Flex direction="column" gap="3">
          {groups.map((group) => (
            <Box key={group.groupId}>
              <Flex justify="between" align="center" mb="3">
                <Heading size="3">{group.name}</Heading>
                <Flex align="center" gap="2">
                  <Badge color={group.teams.length >= teamsPerGroup ? 'green' : 'yellow'}>
                    {group.teams.length}/{teamsPerGroup}
                  </Badge>
                  {group.teams.length < teamsPerGroup && unassignedTeams.length > 0 && (
                    <Flex align="center" gap="1">
                      <Combobox
                        options={unassignedTeams.map((team) => ({
                          value: team._id,
                          label:
                            team.name.length > 15 ? `${team.name.substring(0, 15)}...` : team.name,
                        }))}
                        value={selectedTeamForGroup[group.groupId] || ''}
                        onValueChange={(value) => handleTeamSelectionChange(group.groupId, value)}
                        placeholder="팀 선택"
                        searchPlaceholder="팀 검색..."
                        emptyMessage="선택할 팀이 없습니다."
                        className="min-w-[120px]"
                      />
                      <Button
                        size="1"
                        variant="soft"
                        color="green"
                        onClick={() => handleAddTeam(group.groupId)}
                        disabled={!selectedTeamForGroup[group.groupId]}
                        style={{ cursor: 'pointer', padding: '4px' }}
                      >
                        <Plus width="16" height="16" />
                      </Button>
                    </Flex>
                  )}
                </Flex>
              </Flex>
              <Box
                p="3"
                style={{
                  minHeight: '150px',
                  maxHeight: '250px',
                  border: '2px dashed var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  backgroundColor:
                    group.teams.length >= teamsPerGroup ? 'var(--green-2)' : 'transparent',
                  overflowY: 'auto',
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, group.groupId)}
                onTouchEnd={(e) => handleTouchDrop(e, group.groupId)}
              >
                <Flex direction="column" gap="2">
                  {group.teams.map((team) => (
                    <Card
                      key={team._id}
                      size="1"
                      draggable
                      onDragStart={(e) => handleDragStart(e, team, group.groupId)}
                      onTouchStart={(e) => handleTouchStart(e, team, group.groupId)}
                      style={{ cursor: 'grab' }}
                    >
                      <Box p="2">
                        <Flex align="center" justify="between">
                          <Text size="2" weight="bold" style={{ flex: '1' }}>
                            {team.name} {team.seed && `[시드 ${team.seed}]`}
                          </Text>
                          <Button
                            size="1"
                            variant="ghost"
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTeam(team, group.groupId);
                            }}
                            style={{ cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 width="16" height="16" />
                          </Button>
                        </Flex>
                      </Box>
                    </Card>
                  ))}
                </Flex>
              </Box>
            </Box>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}

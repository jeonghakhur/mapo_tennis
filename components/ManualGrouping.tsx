'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Button, Flex, Card, Heading, Badge, TextField, Select } from '@radix-ui/themes';
import { Plus, Trash2 } from 'lucide-react';
import type { Team, Group } from '@/types/tournament';

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
      const groupId = `group_${String.fromCharCode(65 + i)}`;
      const groupName = `${String.fromCharCode(65 + i)}조`;

      initialGroups.push({
        groupId,
        name: groupName,
        teams: [],
        division: teams[0]?.division || '',
      });
    }

    setGroups(initialGroups);

    // 자동 배정 실행
    if (teams.length > 0) {
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      const newGroups = [...initialGroups];
      const newUnassignedTeams: Team[] = [];

      // 팀들을 순서대로 배정
      shuffledTeams.forEach((team, index) => {
        const groupIndex = Math.floor(index / teamsPerGroup);
        if (groupIndex < newGroups.length) {
          newGroups[groupIndex].teams.push(team);
        } else {
          newUnassignedTeams.push(team);
        }
      });

      setGroups(newGroups);
      setUnassignedTeams(newUnassignedTeams);
    } else {
      setUnassignedTeams([...teams]);
    }
  }, [teams, teamsPerGroup]);

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

  // 터치 오버
  const handleTouchOver = (e: React.TouchEvent) => {
    e.preventDefault();
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

  // 미배정 영역 드래그 오버
  const handleDragOverUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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

  // 미배정 영역으로 드롭
  const handleUnassignedDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedTeam) return;

    const { team, sourceGroupId } = draggedTeam;

    // 조에서 드래그된 경우에만 미배정으로 이동
    if (sourceGroupId) {
      // 소스 그룹에서 팀 제거
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.groupId === sourceGroupId
            ? { ...group, teams: group.teams.filter((t) => t._id !== team._id) }
            : group,
        ),
      );

      // 미배정 팀에 추가
      setUnassignedTeams((prev) => [...prev, team]);
    }

    setDraggedTeam(null);
  };

  // 미배정 영역으로 터치 드롭
  const handleUnassignedTouchDrop = (e: React.TouchEvent) => {
    e.preventDefault();

    if (!draggedTeam || !draggedTeam.sourceGroupId) return;

    const { team, sourceGroupId } = draggedTeam;

    // 소스 그룹에서 팀 제거
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.groupId === sourceGroupId
          ? { ...group, teams: group.teams.filter((t) => t._id !== team._id) }
          : group,
      ),
    );

    // 미배정 팀에 추가
    setUnassignedTeams((prev) => [...prev, team]);
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

    // 팀들을 순서대로 배정
    shuffledTeams.forEach((team, index) => {
      const groupIndex = Math.floor(index / teamsPerGroup);
      if (groupIndex < newGroups.length) {
        newGroups[groupIndex].teams.push(team);
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
        {/* 미배정 팀 영역 */}
        <Heading size="3" mb="3">
          미배정 팀 ({unassignedTeams.length})
        </Heading>
        <Box
          p="3"
          style={{
            minHeight: '200px',
            maxHeight: '300px',
            border: '2px dashed var(--gray-6)',
            borderRadius: 'var(--radius-2)',
            overflowY: 'auto',
          }}
          onDragOver={handleDragOverUnassigned}
          onDrop={handleUnassignedDrop}
          onTouchEnd={(e) => handleUnassignedTouchDrop(e)}
        >
          <Flex direction="column" gap="2">
            {unassignedTeams.map((team) => (
              <Card
                key={team._id}
                size="1"
                draggable
                onDragStart={(e) => handleDragStart(e, team)}
                onTouchStart={(e) => handleTouchStart(e, team)}
                style={{ cursor: 'grab' }}
              >
                <Box p="2">
                  <Text size="2" weight="bold" style={{ wordBreak: 'break-word' }}>
                    {team.name.length > 20 ? `${team.name.substring(0, 20)}...` : team.name}
                  </Text>
                  {team.members && team.members.length > 0 && (
                    <Text size="1" color="gray">
                      {team.members.length}명
                    </Text>
                  )}
                </Box>
              </Card>
            ))}
          </Flex>
        </Box>

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
                      <Select.Root
                        size="1"
                        value={selectedTeamForGroup[group.groupId] || ''}
                        onValueChange={(value) => handleTeamSelectionChange(group.groupId, value)}
                      >
                        <Select.Trigger placeholder="팀 선택" style={{ minWidth: '120px' }} />
                        <Select.Content>
                          {unassignedTeams.map((team) => (
                            <Select.Item key={team._id} value={team._id}>
                              {team.name.length > 15
                                ? `${team.name.substring(0, 15)}...`
                                : team.name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
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
                            {team.name}
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

'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Checkbox, Flex } from '@radix-ui/themes';
import { Combobox } from '@/components/ui/combobox';
import { getClubs } from '@/service/club';
import { client } from '@/sanity/lib/client';
import type { Club } from '@/model/club';

interface ClubSelectorProps {
  userName: string;
  selectedClubIds: string[];
  onClubsChange: (clubIds: string[]) => void;
  disabled?: boolean;
  isNameEntered?: boolean; // 외부에서 실명 입력 완료 상태를 제어
}

export default function ClubSelector({
  userName,
  selectedClubIds,
  onClubsChange,
  disabled = false,
  isNameEntered = false,
}: ClubSelectorProps) {
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<Record<string, boolean>>({});

  // 컴포넌트 마운트 시 클럽 목록 조회
  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true);
      try {
        const clubs = await getClubs();
        setAllClubs(clubs);
      } catch (error) {
        console.error('클럽 목록 조회 실패:', error);
        setError('클럽 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // 사용자의 클럽 가입 여부 확인 - 실명이 입력된 후에만 실행
  useEffect(() => {
    if (!isNameEntered || !userName || !allClubs.length) return;

    const checkMembership = async () => {
      try {
        // 이름으로 클럽 회원 데이터를 직접 검색
        const clubMembers = await client.fetch(
          `
          *[_type == "clubMember" && user == $userName && status == "정회원"] {
            _id,
            user,
            joinedAt,
            status,
            club->{
              _id,
              name
            }
          }
        `,
          { userName },
        );

        // 각 클럽별로 가입 여부 확인
        const statusMap: Record<string, boolean> = {};
        allClubs.forEach((club) => {
          const isMember = clubMembers.some(
            (member: { club: { _id: string } }) => member.club._id === club._id,
          );
          statusMap[club._id!] = isMember;
        });

        setMembershipStatus(statusMap);
      } catch (error) {
        console.error('클럽 가입 여부 확인 실패:', error);
        setError('클럽 가입 여부를 확인하는 중 오류가 발생했습니다.');
      }
    };

    checkMembership();
  }, [userName, allClubs, isNameEntered]);

  const handleClubChange = (clubId: string) => {
    const isMember = membershipStatus[clubId] || false;

    if (selectedClubIds.includes(clubId)) {
      // 이미 선택된 클럽이면 제거
      onClubsChange(selectedClubIds.filter((id) => id !== clubId));
    } else {
      // 가입된 클럽만 선택 가능
      if (isMember) {
        onClubsChange([...selectedClubIds, clubId]);
      }
    }
  };

  const handleClubToggle = (clubId: string) => {
    // 선택된 클럽 목록에서 체크박스 해제 시 제거
    onClubsChange(selectedClubIds.filter((id) => id !== clubId));
  };

  if (isLoading) {
    return (
      <Box>
        <Text size="3" weight="bold" mb="3">
          가입 클럽 선택
        </Text>
        <Text size="2" color="gray">
          클럽 정보를 불러오는 중...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text size="3" weight="bold" mb="3">
          가입 클럽 선택
        </Text>
        <Text size="2" color="red">
          {error}
        </Text>
      </Box>
    );
  }

  if (allClubs.length === 0) {
    return (
      <Box>
        <Text size="3" weight="bold" mb="3">
          가입 클럽 선택
        </Text>
        <Text size="2" color="gray">
          클럽 정보를 불러오는 중입니다...
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text size="3" weight="bold" mb="3">
        가입 클럽 선택
      </Text>

      <Box mb="4">
        <Combobox
          options={allClubs
            .filter((club) => club._id)
            .map((club) => ({
              value: club._id!,
              label: club.name,
            }))}
          value={selectedClubIds.length > 0 ? selectedClubIds[0] : ''}
          onValueChange={handleClubChange}
          placeholder="클럽 선택"
          searchPlaceholder="클럽 검색..."
          emptyMessage="클럽이 없습니다."
          disabled={disabled || !isNameEntered}
        />
      </Box>

      {selectedClubIds.length > 0 && (
        <Box
          mt="4"
          p="3"
          style={{ background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}
        >
          <Text size="2" weight="bold" mb="2" color="blue">
            선택된 클럽 ({selectedClubIds.length}개):
          </Text>
          <Box>
            {selectedClubIds.map((clubId) => {
              const club = allClubs.find((c) => c._id === clubId);
              return (
                <Flex key={clubId} align="center" gap="3" mb="2">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => handleClubToggle(clubId)}
                    disabled={disabled}
                  />
                  <Text size="2" style={{ color: '#0369a1' }}>
                    {club?.name || '알 수 없는 클럽'}
                  </Text>
                </Flex>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

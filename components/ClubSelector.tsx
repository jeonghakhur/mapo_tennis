'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Checkbox, Flex } from '@radix-ui/themes';
import { Combobox } from '@/components/ui/combobox';
import { getClubs } from '@/service/club';
import { client } from '@/sanity/lib/client';
import type { Club } from '@/model/club';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ClubSelectorProps {
  userName: string;
  selectedClubIds: string[];
  onClubsChange: (clubIds: string[]) => void;
  disabled?: boolean;
  isNameEntered?: boolean;
}

export default function ClubSelector({
  userName,
  selectedClubIds,
  onClubsChange,
  disabled = false,
  isNameEntered = true,
}: ClubSelectorProps) {
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<Record<string, boolean>>({});
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertDialogMessage, setAlertDialogMessage] = useState('');

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
    if (!userName || !allClubs.length || !isNameEntered) return;
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
    if (selectedClubIds.includes(clubId)) {
      onClubsChange(selectedClubIds.filter((id) => id !== clubId));
    } else {
      if (disabled || !isNameEntered) {
        setAlertDialogMessage(
          disabled
            ? '클럽 선택이 비활성화되어 있습니다. 클럽을 추가할 수 없습니다.'
            : '이름을 먼저 입력해 주세요.',
        );
        setAlertDialogOpen(true);
      } else {
        const isMember = membershipStatus[clubId] || false;
        if (isMember) {
          onClubsChange([...selectedClubIds, clubId]);
        } else {
          setAlertDialogMessage(
            '가입되어 있지 않은 클럽입니다. 정회원으로 등록된 클럽만 선택할 수 있습니다.',
          );
          setAlertDialogOpen(true);
        }
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
      <ConfirmDialog
        title="알림"
        description={alertDialogMessage}
        confirmText="확인"
        confirmColor="blue"
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        onConfirm={() => setAlertDialogOpen(false)}
      />

      {selectedClubIds.length > 0 && (
        <Box mt="4" pl="1">
          {selectedClubIds.map((clubId) => {
            console.log(clubId);
            const club = allClubs.find((c) => c._id === clubId);
            return (
              <Flex key={clubId} align="center" gap="3" mb="2">
                <Checkbox
                  size="3"
                  checked={true}
                  onCheckedChange={() => handleClubToggle(clubId)}
                />
                <Text size="3">{club?.name || '알 수 없는 클럽'}</Text>
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

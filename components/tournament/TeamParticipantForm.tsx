import { Box, Text } from '@radix-ui/themes';
import { Combobox } from '@/components/ui/combobox';
import { ParticipantForm } from './ParticipantForm';
import { TeamMemberCountSelector } from './TeamMemberCountSelector';
import type { TeamParticipantFormProps } from '@/types/tournament';

export function TeamParticipantForm({
  participants,
  clubs,
  sharedClubId,
  onSharedClubChange,
  teamMemberCount,
  onTeamMemberCountChange,
}: TeamParticipantFormProps) {
  return (
    <>
      {/* 단체전일 때만 공유 클럽 선택 */}
      <Box mb="4" p="4" className="bg-blue-50 rounded-lg border border-blue-200">
        <Text size="3" weight="bold" mb="2" className="block text-blue-800">
          팀 클럽 선택
        </Text>
        <Text size="2" color="gray" mb="3" className="block">
          단체전은 모든 참가자가 같은 클럽에 속해야 합니다.
        </Text>
        <div className="w-full max-w-md">
          <Combobox
            options={clubs
              .filter((club) => club._id)
              .map((club) => ({
                value: club._id!,
                label: club.name,
              }))}
            value={sharedClubId}
            onValueChange={onSharedClubChange}
            placeholder="팀 클럽을 선택하세요"
            searchPlaceholder="클럽 검색..."
            emptyMessage="찾는 클럽이 없습니다."
          />
        </div>
      </Box>

      {/* 참가자 수 선택 */}
      <TeamMemberCountSelector
        teamMemberCount={teamMemberCount}
        onTeamMemberCountChange={onTeamMemberCountChange}
      />

      {/* 참가자 목록 */}
      {participants.map((participant, index) => (
        <ParticipantForm
          key={index}
          label={`참가자-${index + 1} 정보입력`}
          participant={participant}
          clubs={clubs}
          isSharedClub={true}
          sharedClubId={sharedClubId}
        />
      ))}
    </>
  );
}

import { Box, Text, Button, Flex } from '@radix-ui/themes';
import type { TeamMemberCountSelectorProps } from '@/types/tournament';

const TEAM_MEMBER_OPTIONS = [6, 7, 8] as const;

export function TeamMemberCountSelector({
  teamMemberCount,
  onTeamMemberCountChange,
}: TeamMemberCountSelectorProps) {
  return (
    <Box mb="4" p="4" className="bg-gray-100 rounded-lg">
      <Text size="3" weight="bold" mb="2" className="block">
        단체전 참가자 수
      </Text>
      <Flex gap="3" align="center">
        {TEAM_MEMBER_OPTIONS.map((count) => (
          <Button
            key={count}
            type="button"
            variant={teamMemberCount === count ? 'solid' : 'soft'}
            color={teamMemberCount === count ? 'blue' : 'gray'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTeamMemberCountChange(count);
            }}
            size="3"
            className={
              teamMemberCount === count ? 'ring-2 ring-blue-300 ring-offset-2' : 'hover:bg-gray-200'
            }
          >
            {count}명
          </Button>
        ))}
      </Flex>
    </Box>
  );
}

import type { ParticipantHookReturn } from '@/types/tournament';

export function createValidationFunction(
  participants: ParticipantHookReturn[],
  isIndividual: boolean,
  division: string,
  contact: string,
) {
  return (): { error: string; field: string } | null => {
    // 참가자 정보 검증
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      if (!participant.name) {
        return { error: `${i + 1}번째 참가자 이름을 입력해주세요.`, field: `player${i + 1}Name` };
      }
      if (!participant.clubId) {
        return {
          error: `${i + 1}번째 참가자의 클럽을 선택해주세요.`,
          field: `player${i + 1}ClubId`,
        };
      }
      if (!participant.birth) {
        return {
          error: `${i + 1}번째 참가자의 생년월일을 입력해주세요.`,
          field: `player${i + 1}Birth`,
        };
      }
      if (!participant.score) {
        return {
          error: `${i + 1}번째 참가자의 점수를 입력해주세요.`,
          field: `player${i + 1}Score`,
        };
      }
    }

    // 단체전 클럽 일치 검증
    if (!isIndividual) {
      const clubIds = participants.map((p) => p.clubId);
      if (new Set(clubIds).size > 1) {
        return { error: '단체전은 모든 참가자가 같은 클럽에 속해야 합니다.', field: 'sharedClub' };
      }
    }

    if (!division) return { error: '참가부서를 선택해주세요.', field: 'division' };
    if (!contact) return { error: '연락처를 입력해주세요.', field: 'contact' };
    return null;
  };
}

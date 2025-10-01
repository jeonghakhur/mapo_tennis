import type { ParticipantHookReturn } from '@/types/tournament';

export function createValidationFunction(
  participants: ParticipantHookReturn[],
  isIndividual: boolean,
  division: string,
  requiredParticipantCount?: number,
) {
  return (): { error: string; field: string } | null => {
    // 검증할 참가자 수 결정 (시니어부 개인전은 1명, 그 외는 전체)
    const participantsToValidate = requiredParticipantCount
      ? participants.slice(0, requiredParticipantCount)
      : participants;

    // 참가자 정보 검증
    for (let i = 0; i < participantsToValidate.length; i++) {
      const participant = participantsToValidate[i];

      // 클럽 검증
      if (!participant.clubId) {
        return {
          error: `${i + 1}번째 참가자의 클럽을 선택해주세요.`,
          field: `player${i + 1}ClubId`,
        };
      }

      if (!participant.name) {
        return { error: `${i + 1}번째 참가자 이름을 입력해주세요.`, field: `player${i + 1}Name` };
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
      const clubIds = participantsToValidate.map((p) => p.clubId);
      if (new Set(clubIds).size > 1) {
        return { error: '단체전은 모든 참가자가 같은 클럽에 속해야 합니다.', field: 'sharedClub' };
      }
    }

    if (!division) return { error: '참가부서를 선택해주세요.', field: 'division' };
    return null;
  };
}

import type { TournamentFormData } from '@/model/tournament';
import type { Group, Match, GroupStanding, Team } from '@/types/tournament';

// 참가부서 옵션
export const DIVISION_OPTIONS = [
  { value: 'master', label: '마스터부' },
  { value: 'challenger', label: '챌린저부' },
  { value: 'futures', label: '퓨처스부' },
  { value: 'chrysanthemum', label: '국화부' },
  { value: 'forsythia', label: '개나리부' },
  { value: 'senior', label: '시니어부' },
] as const;

// 부서별 기본값 설정
export const DIVISION_DEFAULTS = {
  master: { teamCount: 24, prizes: { first: '500,000', second: '300,000', third: '200,000' } },
  challenger: { teamCount: 36, prizes: { first: '500,000', second: '300,000', third: '200,000' } },
  futures: { teamCount: 24, prizes: { first: '300,000', second: '200,000', third: '100,000' } },
  chrysanthemum: {
    teamCount: 24,
    prizes: { first: '300,000', second: '200,000', third: '100,000' },
  },
  forsythia: { teamCount: 24, prizes: { first: '300,000', second: '200,000', third: '100,000' } },
  senior: { teamCount: 24, prizes: { first: '300,000', second: '200,000', third: '100,000' } },
} as const;

export const DEFAULT_START_TIME = '08:00';

// 부서 필드 타입
export type DivisionField =
  | 'teamCount'
  | 'playerCount'
  | 'matchDates'
  | 'startTime'
  | 'first'
  | 'second'
  | 'third';

// 검증 결과 타입
export interface ValidationResult {
  isValid: boolean;
  message: string;
  field: string;
}

// 대회 기간의 모든 날짜를 생성하는 함수
export function generateDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];

  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

// 부서별 상세 정보 변경 핸들러
export function handleDivisionDetailChange(
  formData: TournamentFormData,
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>,
  divisionValue: string,
  field: DivisionField,
  value: string | number | string[],
) {
  setFormData((prev) => {
    const newDivisions = prev.divisions?.map((division) => {
      if (division.division !== divisionValue) return division;

      let updatedDivision = { ...division };
      if (field === 'first' || field === 'second' || field === 'third') {
        updatedDivision = {
          ...division,
          prizes: {
            ...division.prizes,
            [field]: value as number,
          },
        };
      } else {
        updatedDivision = {
          ...division,
          [field]: value,
        };
      }

      return updatedDivision;
    });

    return {
      ...prev,
      divisions: newDivisions,
    };
  });
}

// 시합일 체크박스 핸들러
export function handleMatchDateChange(
  formData: TournamentFormData,
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>,
  divisionValue: string,
  date: string,
  checked: boolean,
) {
  const currentDivision = formData.divisions?.find((d) => d.division === divisionValue);
  const currentDates = currentDivision?.matchDates || [];

  let newDates: string[];
  if (checked) {
    newDates = [...currentDates, date];
  } else {
    newDates = currentDates.filter((d) => d !== date);
  }

  handleDivisionDetailChange(formData, setFormData, divisionValue, 'matchDates', newDates);
}

// 필드에 포커스 이동하는 함수
export function focusToField(
  field: string,
  refs: {
    titleRef: React.RefObject<HTMLInputElement | null>;
    locationRef: React.RefObject<HTMLInputElement | null>;
    startDateRef: React.RefObject<HTMLInputElement | null>;
    registrationStartDateRef: React.RefObject<HTMLInputElement | null>;
    registrationDeadlineRef: React.RefObject<HTMLInputElement | null>;
  },
) {
  let targetElement: HTMLElement | null = null;

  switch (field) {
    case 'title':
      targetElement = refs.titleRef.current;
      break;
    case 'location':
      targetElement = refs.locationRef.current;
      break;
    case 'startDate':
      targetElement = refs.startDateRef.current;
      break;
    case 'registrationStartDate':
      targetElement = refs.registrationStartDateRef.current;
      break;
    case 'endDate':
      // endDate ref가 없으므로 startDate로 대체
      targetElement = refs.startDateRef.current;
      break;
    case 'registrationDeadline':
      targetElement = refs.registrationDeadlineRef.current;
      break;
    case 'divisions':
      // divisions는 체크박스이므로 첫 번째 체크박스로 포커스
      const firstCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (firstCheckbox) {
        firstCheckbox.focus();
        firstCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
  }

  if (targetElement) {
    targetElement.focus();
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// 입력 필드 변경 핸들러
export function handleInputChange(
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>,
  field: keyof TournamentFormData,
  value: string | number | undefined,
) {
  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }));
}

// 상세 정보 입력 가능 여부 확인
export function canShowDivisionDetails(formData: TournamentFormData): boolean {
  return !!(formData.startDate && formData.endDate);
}

// 부서별 시상금 기본값 설정 함수
export function getDefaultPrizes(divisionValue: string) {
  switch (divisionValue) {
    case 'master':
    case 'challenger':
      return { first: '500,000', second: '300,000', third: '200,000' };
    case 'futures':
    case 'forsythia':
    case 'chrysanthemum':
    case 'senior':
      return { first: '300,000', second: '200,000', third: '100,000' };
    default:
      return { first: '', second: '', third: '' };
  }
}

// 부서별 참가팀수 기본값 설정 함수
export function getDefaultTeamCount(divisionValue: string) {
  switch (divisionValue) {
    case 'master':
      return 24;
    case 'challenger':
      return 36;
    case 'futures':
    case 'forsythia':
    case 'chrysanthemum':
    case 'senior':
      return 24;
    default:
      return 0;
  }
}

// 부서별 시작시간 기본값 설정 함수
export function getDefaultStartTime() {
  return DEFAULT_START_TIME;
}

// 기본 대회 폼 데이터 생성 함수
export function createDefaultTournamentFormData(): TournamentFormData {
  return {
    title: '',
    startDate: '',
    endDate: '',
    location: '망원나들목테니스장 외 보조 경기장',
    tournamentType: 'individual',
    registrationStartDate: '',
    registrationDeadline: '',
    descriptionPostId: '',
    rulesPostId: '',
    host: '마포구청, 마포구 체육회',
    organizer: '마포구테니스협회',
    participants: '',
    registrationMethod: '온라인접수',
    drawMethod: '',
    equipment: '낫소 볼',
    memo: '',
    divisions: [], // 기본적으로 빈 배열, 사용자가 체크박스로 선택
    entryFee: 30000,
    bankAccount: '1001-8348-6182 (토스뱅크)',
    accountHolder: '허정학',
    openingCeremony: {
      isHeld: false,
      date: '',
      time: '',
      location: '',
    },
  };
}

// 기본 필드 검증
export function validateBasicFields(formData: TournamentFormData): ValidationResult {
  if (!formData.title.trim()) {
    return { isValid: false, message: '대회명을 입력해주세요.', field: 'title' };
  }
  if (!formData.location.trim()) {
    return { isValid: false, message: '대회 장소를 입력해주세요.', field: 'location' };
  }
  if (!formData.startDate) {
    return { isValid: false, message: '대회 시작일을 선택해주세요.', field: 'startDate' };
  }
  if (!formData.registrationStartDate) {
    return {
      isValid: false,
      message: '등록 시작일을 선택해주세요.',
      field: 'registrationStartDate',
    };
  }
  if (!formData.registrationDeadline) {
    return {
      isValid: false,
      message: '등록 마감일을 선택해주세요.',
      field: 'registrationDeadline',
    };
  }
  return { isValid: true, message: '', field: '' };
}

// 부서별 상세 정보 검증
export function validateDivisionDetails(
  formData: TournamentFormData,
  showDivisionDetails: boolean,
): ValidationResult {
  if (!showDivisionDetails) return { isValid: true, message: '', field: '' };

  // 최소 하나의 참가부서가 선택되어야 함
  if (!formData.divisions || formData.divisions.length === 0) {
    return {
      isValid: false,
      message: '최소 하나 이상의 참가부서를 선택해주세요.',
      field: 'divisions',
    };
  }

  for (const division of formData.divisions) {
    if (!division.teamCount || division.teamCount < 1) {
      const divisionOption = DIVISION_OPTIONS.find((option) => option.value === division.division);
      return {
        isValid: false,
        message: `${divisionOption?.label}의 참가팀수를 1명 이상 입력해주세요.`,
        field: 'divisions',
      };
    }

    if (!division.matchDates || division.matchDates.length === 0) {
      const divisionOption = DIVISION_OPTIONS.find((option) => option.value === division.division);
      return {
        isValid: false,
        message: `${divisionOption?.label}의 시합일을 선택해주세요.`,
        field: 'divisions',
      };
    }

    if (!division.startTime) {
      const divisionOption = DIVISION_OPTIONS.find((option) => option.value === division.division);
      return {
        isValid: false,
        message: `${divisionOption?.label}의 시작 시간을 입력해주세요.`,
        field: 'divisions',
      };
    }
  }
  return { isValid: true, message: '', field: '' };
}

// 날짜 유효성 검사
export function validateDates(formData: TournamentFormData): ValidationResult {
  const startDate = new Date(formData.startDate);
  const registrationStartDate = formData.registrationStartDate
    ? new Date(formData.registrationStartDate)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // if (startDate < today) {
  //   return { isValid: false, message: '대회 시작일은 오늘 이후여야 합니다.', field: 'startDate' };
  // }

  // if (registrationStartDate && registrationStartDate < today) {
  //   return {
  //     isValid: false,
  //     message: '등록 시작일은 오늘 이후여야 합니다.',
  //     field: 'registrationStartDate',
  //   };
  // }

  if (registrationStartDate && registrationStartDate > startDate) {
    return {
      isValid: false,
      message: '등록 시작일은 대회 시작일 이전이어야 합니다.',
      field: 'registrationStartDate',
    };
  }

  if (formData.endDate && new Date(formData.endDate) < startDate) {
    return { isValid: false, message: '대회 종료일은 시작일 이후여야 합니다.', field: 'endDate' };
  }

  if (formData.registrationDeadline && new Date(formData.registrationDeadline) > startDate) {
    return {
      isValid: false,
      message: '등록 마감일은 대회 시작일 이전이어야 합니다.',
      field: 'registrationDeadline',
    };
  }

  return { isValid: true, message: '', field: '' };
}

// 전체 폼 검증
export function validateTournamentForm(
  formData: TournamentFormData,
  showDivisionDetails: boolean,
): ValidationResult {
  const basicValidation = validateBasicFields(formData);
  if (!basicValidation.isValid) return basicValidation;

  const divisionValidation = validateDivisionDetails(formData, showDivisionDetails);
  if (!divisionValidation.isValid) return divisionValidation;

  const dateValidation = validateDates(formData);
  if (!dateValidation.isValid) return dateValidation;

  return { isValid: true, message: '', field: '' };
}

// FormData에서 대회 데이터를 파싱하는 공통 함수
export function parseTournamentFormData(
  formData: FormData,
): Partial<TournamentFormData> & { status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' } {
  const title = formData.get('title') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const location = formData.get('location') as string;
  const tournamentType = formData.get('tournamentType') as string;
  const registrationStartDate = formData.get('registrationStartDate') as string;
  const registrationDeadline = formData.get('registrationDeadline') as string;
  const descriptionPostId = formData.get('descriptionPostId') as string;
  const rulesPostId = formData.get('rulesPostId') as string;
  const host = formData.get('host') as string;
  const organizer = formData.get('organizer') as string;
  const participants = formData.get('participants') as string;
  const registrationMethod = formData.get('registrationMethod') as string;
  const drawMethod = formData.get('drawMethod') as string;
  const equipment = formData.get('equipment') as string;
  const memo = formData.get('memo') as string;
  const status = formData.get('status') as string;
  const entryFee = formData.get('entryFee') as string;
  const bankAccount = formData.get('bankAccount') as string;
  const accountHolder = formData.get('accountHolder') as string;
  const clubJoinDate = formData.get('clubJoinDate') as string;
  const divisions = formData.get('divisions') as string;
  const openingCeremony = formData.get('openingCeremony') as string;

  let parsedDivisions;
  try {
    parsedDivisions = divisions ? JSON.parse(divisions) : undefined;
  } catch (error) {
    console.error('divisions 파싱 오류:', error);
    throw new Error('참가부서 데이터 형식이 올바르지 않습니다.');
  }

  let parsedOpeningCeremony;
  try {
    parsedOpeningCeremony = openingCeremony ? JSON.parse(openingCeremony) : undefined;
  } catch (error) {
    console.error('openingCeremony 파싱 오류:', error);
    parsedOpeningCeremony = undefined;
  }

  return {
    title,
    startDate,
    endDate,
    location,
    tournamentType: tournamentType as 'individual' | 'team',
    status: status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    registrationStartDate: registrationStartDate || undefined,
    registrationDeadline: registrationDeadline || undefined,
    descriptionPostId:
      descriptionPostId === 'null' || descriptionPostId === '' ? null : descriptionPostId,
    rulesPostId: rulesPostId === 'null' || rulesPostId === '' ? null : rulesPostId,
    host: host || undefined,
    organizer: organizer || undefined,
    participants: participants || undefined,
    registrationMethod: registrationMethod || undefined,
    drawMethod: drawMethod || undefined,
    equipment: equipment || undefined,
    memo: memo || undefined,
    entryFee: entryFee ? parseInt(entryFee) : undefined,
    bankAccount: bankAccount || undefined,
    accountHolder: accountHolder || undefined,
    clubJoinDate: clubJoinDate || undefined,
    divisions: parsedDivisions,
    openingCeremony: parsedOpeningCeremony,
  };
}

/**
 * 부서 value를 한글 label로 변환하는 함수
 */
export function getDivisionLabel(value: string): string {
  const found = DIVISION_OPTIONS.find((option) => option.value === value);
  return found ? found.label : value;
}

/**
 * 대회 유형을 한글로 변환하는 함수
 */
export function getTournamentTypeLabel(value: string): string {
  const typeMap: Record<string, string> = {
    individual: '개인전',
    team: '단체전',
  };
  return typeMap[value] || value;
}

// GroupStanding을 다시 export (타입 재사용)
export type { GroupStanding };

/**
 * 매치 데이터와 그룹 데이터로부터 조별 순위를 계산합니다
 */
export function calculateGroupStandingsFromMatches(
  groups: Group[],
  matches: Match[],
): GroupStanding[] {
  const allStandings: GroupStanding[] = [];

  groups.forEach((group) => {
    const groupMatches = matches.filter((match) => match.groupId === group.groupId);
    const standings = new Map<string, GroupStanding>();

    // 초기 순위 데이터 생성
    // Sanity에서 가져온 teams는 _key를 가지고 있고, 이것이 경기의 teamId와 매칭됩니다
    group.teams.forEach((team) => {
      // Sanity 배열의 team은 _key를 가지고 있고, 경기 생성 시 이것이 teamId로 사용됩니다
      // team 객체에서 _key 또는 _id를 안전하게 가져옵니다
      const teamData = team as Team & { _key?: string };
      const teamId = teamData._key || team._id;

      if (!teamId) {
        console.warn('Team without valid ID:', team);
        return;
      }

      standings.set(teamId, {
        teamId,
        teamName: team.name,
        groupId: group.groupId,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        position: 0,
      });
    });

    // 경기 결과 반영
    groupMatches.forEach((match) => {
      if (match.status === 'completed') {
        const team1Standing = standings.get(match.team1.teamId);
        const team2Standing = standings.get(match.team2.teamId);

        if (!team1Standing) {
          console.warn(`  ⚠️ team1 Standing을 찾을 수 없음: ${match.team1.teamId}`);
        }
        if (!team2Standing) {
          console.warn(`  ⚠️ team2 Standing을 찾을 수 없음: ${match.team2.teamId}`);
        }

        if (team1Standing && team2Standing) {
          // 경기 수 증가
          team1Standing.played++;
          team2Standing.played++;

          // 세트별 점수로 승부 결정
          let team1SetsWon = 0;
          let team2SetsWon = 0;
          let team1TotalGames = 0;
          let team2TotalGames = 0;

          if (match.team1.sets && match.team2.sets) {
            const maxSets = Math.max(match.team1.sets.length, match.team2.sets.length);

            for (let i = 0; i < maxSets; i++) {
              const team1Games = match.team1.sets[i]?.games || 0;
              const team2Games = match.team2.sets[i]?.games || 0;
              const team1Tiebreak = match.team1.sets[i]?.tiebreak;
              const team2Tiebreak = match.team2.sets[i]?.tiebreak;

              // 총 게임 수 계산
              team1TotalGames += team1Games;
              team2TotalGames += team2Games;

              // 세트 승부 결정
              if (team1Games > team2Games) {
                team1SetsWon++;
              } else if (team2Games > team1Games) {
                team2SetsWon++;
              } else {
                // 게임 수가 동일한 경우 타이브레이크로 승부 결정
                if (team1Tiebreak !== undefined && team2Tiebreak !== undefined) {
                  if (team1Tiebreak > team2Tiebreak) {
                    team1SetsWon++;
                  } else if (team2Tiebreak > team1Tiebreak) {
                    team2SetsWon++;
                  }
                }
              }
            }
          } else {
            // 기존 호환성을 위해 score 필드도 확인
            if (match.team1.score !== undefined && match.team2.score !== undefined) {
              team1TotalGames = match.team1.score;
              team2TotalGames = match.team2.score;

              if (match.team1.score > match.team2.score) {
                team1SetsWon = 1;
                team2SetsWon = 0;
              } else if (match.team2.score > match.team1.score) {
                team1SetsWon = 0;
                team2SetsWon = 1;
              }
            }
          }

          // 득점/실점 기록 (총 게임 수 사용)
          team1Standing.goalsFor += team1TotalGames;
          team1Standing.goalsAgainst += team2TotalGames;
          team2Standing.goalsFor += team2TotalGames;
          team2Standing.goalsAgainst += team1TotalGames;

          // 승패 결정 (세트 승부 기준)
          if (team1SetsWon > team2SetsWon) {
            team1Standing.won++;
            team2Standing.lost++;
            team1Standing.points += 3;
          } else if (team2SetsWon > team1SetsWon) {
            team1Standing.lost++;
            team2Standing.won++;
            team2Standing.points += 3;
          } else {
            team1Standing.drawn++;
            team2Standing.drawn++;
            team1Standing.points += 1;
            team2Standing.points += 1;
          }
        }
      }
    });

    // 득실차 계산
    standings.forEach((standing) => {
      standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
    });

    // 순위 정렬: 승점 > 득실차 > 득점
    const sortedStandings = Array.from(standings.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // 순위 부여
    sortedStandings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    allStandings.push(...sortedStandings);
  });

  return allStandings;
}

'use client';
import { Box, Button, Flex, Heading, AlertDialog } from '@radix-ui/themes';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Tournament } from '@/model/tournament';
import type { TournamentApplication } from '@/model/tournamentApplication';
import { DIVISION_OPTIONS } from '@/lib/tournamentUtils';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import { useParticipant } from '@/hooks/useParticipant';
import { useClubs } from '@/hooks/useClubs';
import { useUser } from '@/hooks/useUser';
import { useSession } from 'next-auth/react';
import { createValidationFunction } from '@/lib/tournamentValidation';
import { ParticipantForm } from '@/components/tournament/ParticipantForm';
import { TeamParticipantForm } from '@/components/tournament/TeamParticipantForm';
import { TournamentParticipationForm } from '@/components/tournament/TournamentParticipationForm';
import type { ClubMember } from '@/types/tournament';
import { isModerator } from '@/lib/authUtils';

// 상수 정의
const INDIVIDUAL_PARTICIPANTS = 2;

interface TournamentApplicationFormProps {
  tournament: Tournament;
  onCancel: () => void;
  isEdit?: boolean;
  applicationId?: string;
  initialData?: TournamentApplication;
}

export default function TournamentApplicationForm({
  tournament,
  onCancel,
  isEdit = false,
  applicationId,
  initialData,
}: TournamentApplicationFormProps) {
  const router = useRouter();
  const { loading, withLoading } = useLoading();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { clubs, isLoading: clubsLoading } = useClubs();

  // 폼 상태
  const [division, setDivision] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [isFeePaid, setIsFeePaid] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isFeePaidInSuccess, setIsFeePaidInSuccess] = useState(false);

  // 필드 refs
  const divisionRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);

  // 초기화 상태 추적
  const isInitialized = useRef(false);

  // 참가 가능한 부서 필터링
  const availableDivisions = useMemo(
    () =>
      tournament.divisions
        ?.filter((div) => div.teamCount > 0)
        .map((div) => DIVISION_OPTIONS.find((option) => option.value === div.division))
        .filter(Boolean) || [],
    [tournament.divisions],
  );

  // 수정 모드일 때 초기 데이터 로드
  useEffect(() => {
    if (isEdit && initialData) {
      setDivision(initialData.division);
      setContact(initialData.contact);
      setEmail(initialData.email || '');
      setMemo(initialData.memo || '');
      setIsFeePaid(initialData.isFeePaid);
    }
  }, [isEdit, initialData]);

  // 클럽 회원 검색 (메모이제이션)
  const searchClubMember = useCallback(
    async (name: string, clubId: string): Promise<ClubMember | null> => {
      if (!name.trim() || !clubId) return null;

      try {
        const response = await fetch(
          `/api/club-members/search?name=${encodeURIComponent(name.trim())}&clubId=${clubId}`,
        );
        if (response.ok) {
          const result = await response.json();
          return result.found ? result.member : null;
        }
      } catch (error) {
        console.error('클럽 회원 검색 오류:', error);
      }
      return null;
    },
    [],
  );

  // 참가자 관리
  const isIndividual = tournament.tournamentType === 'individual';

  // 개별 참가자 훅 선언 (최대 8명)
  const player1 = useParticipant(searchClubMember);
  const player2 = useParticipant(searchClubMember);
  const player3 = useParticipant(searchClubMember);
  const player4 = useParticipant(searchClubMember);
  const player5 = useParticipant(searchClubMember);
  const player6 = useParticipant(searchClubMember);
  const player7 = useParticipant(searchClubMember);
  const player8 = useParticipant(searchClubMember);

  // 참가자 배열 생성
  const participants = useMemo(() => {
    const allParticipants = [
      player1,
      player2,
      player3,
      player4,
      player5,
      player6,
      player7,
      player8,
    ];
    return allParticipants;
  }, [player1, player2, player3, player4, player5, player6, player7, player8]);

  // 단체전 참가자 수 관리
  const [teamMemberCount, setTeamMemberCount] = useState<number>(6);

  // 단체전 공유 클럽 ID
  const [sharedClubId, setSharedClubId] = useState<string>('');

  // 공유 클럽 변경 시 모든 참가자의 클럽도 변경
  const handleSharedClubChange = useCallback(
    (clubId: string) => {
      setSharedClubId(clubId);
      if (!isIndividual) {
        participants.forEach((participant) => {
          participant.setClubIdForced(clubId);
        });
      }
    },
    [isIndividual, participants],
  );

  // 단체전 참가자 수 변경
  const handleTeamMemberCountChange = useCallback((count: number) => {
    if (count >= 6 && count <= 8) {
      setTeamMemberCount(count);
    }
  }, []);

  // 현재 활성 참가자 배열
  const activeParticipants = useMemo(() => {
    if (isIndividual) {
      return participants.slice(0, INDIVIDUAL_PARTICIPANTS);
    }
    return participants.slice(0, teamMemberCount);
  }, [isIndividual, participants, teamMemberCount]);

  // 수정 모드일 때 참가자 정보 초기화
  useEffect(() => {
    if (isEdit && initialData && initialData.teamMembers && !isInitialized.current) {
      // 참가자 정보 설정
      initialData.teamMembers.forEach(
        (
          member: {
            name: string;
            clubId: string;
            birth?: string;
            score?: number;
            isRegisteredMember?: boolean;
          },
          index: number,
        ) => {
          const participant = participants[index];
          if (participant) {
            participant.setNameDirect(member.name);
            participant.setClubIdDirect(member.clubId);
            participant.setBirthDirect(member.birth || '');
            participant.setScoreDirect(member.score?.toString() || '');
            participant.setIsRegisteredDirect(member.isRegisteredMember || false);
          }
        },
      );

      // 단체전인 경우 참가자 수 설정
      if (!isIndividual && initialData.teamMembers.length >= 6) {
        setTeamMemberCount(initialData.teamMembers.length);
      }

      // 단체전인 경우 공유 클럽 설정
      if (!isIndividual && initialData.teamMembers.length > 0) {
        const firstClubId = initialData.teamMembers[0].clubId;
        setSharedClubId(firstClubId);
      }

      // 초기화 완료 표시
      isInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, initialData, isIndividual]);

  // 통합된 검증 함수
  const validateForm = useMemo(
    () => createValidationFunction(activeParticipants, isIndividual, division, contact),
    [activeParticipants, isIndividual, division, contact],
  );

  // 폼 제출
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validation = validateForm();
      if (validation) {
        setAlertMessage(validation.error);
        setShowAlert(true);

        // 해당 필드로 포커스 이동
        setTimeout(() => {
          switch (validation.field) {
            case 'participants':
              activeParticipants[0]?.nameRef.current?.focus();
              break;
            case 'sharedClub':
              activeParticipants[0]?.clubRef.current?.focus();
              break;
            case 'division':
              divisionRef.current?.focus();
              break;
            case 'contact':
              contactRef.current?.focus();
              break;
            default:
              const match = validation.field.match(/player(\d+)(\w+)/);
              if (match) {
                const playerIndex = parseInt(match[1]) - 1;
                const fieldType = match[2];
                const participant = activeParticipants[playerIndex];
                if (participant) {
                  switch (fieldType) {
                    case 'Name':
                      participant.nameRef.current?.focus();
                      break;
                    case 'ClubId':
                      participant.clubRef.current?.focus();
                      break;
                    case 'Birth':
                      participant.birthRef.current?.focus();
                      break;
                    case 'Score':
                      participant.scoreRef.current?.focus();
                      break;
                  }
                }
              }
              break;
          }
        }, 100);

        return;
      }

      setIsSubmitting(true);

      try {
        await withLoading(async () => {
          const formData = new FormData();
          formData.append('tournamentId', tournament._id);
          formData.append('division', division);
          formData.append('tournamentType', tournament.tournamentType);

          // 참가자 정보 추가
          activeParticipants.forEach((participant, index) => {
            const prefix = `player${index + 1}`;
            const clubName = clubs.find((c) => c._id === participant.clubId)?.name || '';

            formData.append(`${prefix}Name`, participant.name);
            formData.append(`${prefix}ClubId`, participant.clubId);
            formData.append(`${prefix}ClubName`, clubName);
            formData.append(`${prefix}Birth`, participant.birth);
            formData.append(`${prefix}Score`, participant.score);
            formData.append(
              `${prefix}IsRegistered`,
              participant.isRegistered?.toString() || 'false',
            );
          });

          formData.append('contact', contact);
          if (email) formData.append('email', email);
          if (memo) formData.append('memo', memo);
          formData.append('isFeePaid', isFeePaid.toString());

          const url = isEdit
            ? `/api/tournament-applications/${applicationId}`
            : '/api/tournament-applications';
          const method = isEdit ? 'PUT' : 'POST';

          const response = await fetch(url, {
            method,
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error ||
                (isEdit ? '참가 신청 수정에 실패했습니다.' : '참가 신청에 실패했습니다.'),
            );
          }

          // 성공 메시지 설정
          const baseMessage = isEdit
            ? '참가 신청이 수정되었습니다.'
            : '참가 신청이 완료되었습니다.';

          if (!isFeePaid) {
            setSuccessMessage(
              `${baseMessage}\n\n참가비를 입금하지 않으셨습니다.\n참가비 입금 후 참가비 납부 여부를 수정해주세요.`,
            );
            setIsFeePaidInSuccess(false);
          } else {
            setSuccessMessage(baseMessage);
            setIsFeePaidInSuccess(true);
          }

          setShowSuccessDialog(true);
        });
      } catch (error) {
        console.error('참가 신청 오류:', error);
        alert(error instanceof Error ? error.message : '참가 신청에 실패했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validateForm,
      activeParticipants,
      clubs,
      tournament,
      division,
      contact,
      email,
      memo,
      isFeePaid,
      isEdit,
      applicationId,
      withLoading,
    ],
  );

  return (
    <Box>
      {(loading || clubsLoading) && <LoadingOverlay size="3" />}
      <Heading as="h2" size="4" mb="3">
        {tournament.title} - {isEdit ? '참가 신청 수정' : '참가 신청'}
      </Heading>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isIndividual ? (
          // 개인전
          <>
            {activeParticipants.map((participant, index) => (
              <ParticipantForm
                key={index}
                label={`참가자-${index + 1} 정보입력`}
                participant={participant}
                clubs={clubs}
              />
            ))}
          </>
        ) : (
          // 단체전
          <>
            <h2 className="text-xl font-bold">참가자 정보</h2>
            <TeamParticipantForm
              participants={activeParticipants}
              clubs={clubs}
              sharedClubId={sharedClubId}
              onSharedClubChange={handleSharedClubChange}
              teamMemberCount={teamMemberCount}
              onTeamMemberCountChange={handleTeamMemberCountChange}
            />
          </>
        )}

        {/* 대회 참석 정보 */}
        <TournamentParticipationForm
          availableDivisions={availableDivisions}
          division={division}
          setDivision={setDivision}
          contact={contact}
          setContact={setContact}
          email={email}
          setEmail={setEmail}
          memo={memo}
          setMemo={setMemo}
          isFeePaid={isFeePaid}
          setIsFeePaid={setIsFeePaid}
          divisionRef={divisionRef}
          contactRef={contactRef}
        />

        <Flex gap="3" justify="end" className="btn-wrap">
          <Button type="button" variant="soft" onClick={onCancel} size="3">
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting} size="3">
            {isSubmitting
              ? isEdit
                ? '수정 중...'
                : '신청 중...'
              : isEdit
                ? '수정 완료'
                : '참가 신청'}
          </Button>
        </Flex>
      </form>

      {/* 알림 다이얼로그 */}
      <AlertDialog.Root open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialog.Content>
          <AlertDialog.Title>입력 오류</AlertDialog.Title>
          <AlertDialog.Description>{alertMessage}</AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="surface" color="red" size="3">
                확인
              </Button>
            </AlertDialog.Cancel>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* 성공 다이얼로그 */}
      <AlertDialog.Root open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialog.Content>
          <AlertDialog.Title>{isEdit ? '참가 신청 수정 완료' : '참가 신청 완료'}</AlertDialog.Title>
          <AlertDialog.Description>
            <span className="whitespace-pre-line">{successMessage}</span>
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button
                variant="surface"
                color={isFeePaidInSuccess ? 'green' : 'orange'}
                size="3"
                onClick={() => {
                  // 수정 후 이동 경로 결정
                  if (isEdit) {
                    // 어드민(레벨 4 이상)은 어드민 목록으로, 일반 사용자는 일반 목록으로
                    const moderator = isModerator(user);
                    router.push(
                      moderator ? '/tournament-applications/admin' : '/tournament-applications',
                    );
                  } else {
                    router.push('/tournament-applications');
                  }
                }}
              >
                목록으로 이동
              </Button>
            </AlertDialog.Cancel>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}

'use client';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import type { TournamentFormData, Tournament } from '@/model/tournament';
import { useTournament } from '@/hooks/useTournaments';
import { useLoading } from '@/hooks/useLoading';
import TournamentForm from '@/components/TournamentForm';
import {
  DIVISION_OPTIONS,
  getDefaultPrizes,
  getDefaultTeamCount,
  getDefaultStartTime,
  createDefaultTournamentFormData,
} from '@/lib/tournamentUtils';

interface EditTournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

// 초기 폼 데이터 생성
const createInitialFormData = (): TournamentFormData => ({
  ...createDefaultTournamentFormData(),
  // 수정 페이지에서는 기본값을 비워둠
  title: '',
  startDate: '',
  endDate: '',
  location: '',
  registrationStartDate: '',
  registrationDeadline: '',
  descriptionPostId: '',
  rulesPostId: '',
  host: '',
  organizer: '',
  participants: '',
  registrationMethod: '',
  drawMethod: '',
  equipment: '',
  memo: '',
  entryFee: 0,
  bankAccount: '',
  accountHolder: '',
  clubJoinDate: '',
});

// divisions 데이터 파싱 함수
const parseDivisions = (divisions: unknown) => {
  if (!divisions) {
    return DIVISION_OPTIONS.map((option) => ({
      _key: option.value,
      division: option.value,
      teamCount: getDefaultTeamCount(option.value),
      matchDates: [],
      startTime: getDefaultStartTime(),
      prizes: getDefaultPrizes(option.value),
    }));
  }

  if (typeof divisions === 'string') {
    try {
      return JSON.parse(divisions);
    } catch (error) {
      console.error('divisions 파싱 오류:', error);
      return DIVISION_OPTIONS.map((option) => ({
        _key: option.value,
        division: option.value,
        teamCount: getDefaultTeamCount(option.value),
        matchDates: [],
        startTime: getDefaultStartTime(),
        prizes: getDefaultPrizes(option.value),
      }));
    }
  }

  return divisions;
};

// 날짜 문자열을 YYYY-MM-DD 형식으로 변환
const formatDateForInput = (dateString: string): string => {
  return dateString.split('T')[0];
};

// FormData 생성 함수
const createFormData = (formData: TournamentFormData, status: string): FormData => {
  const formDataObj = new FormData();

  // 기본 필드들 추가
  const fields = [
    { key: 'title', value: formData.title },
    { key: 'startDate', value: formData.startDate },
    { key: 'endDate', value: formData.endDate },
    { key: 'location', value: formData.location },
    { key: 'tournamentType', value: formData.tournamentType },
    { key: 'registrationStartDate', value: formData.registrationStartDate || '' },
    { key: 'registrationDeadline', value: formData.registrationDeadline || '' },
    { key: 'descriptionPostId', value: formData.descriptionPostId || '' },
    { key: 'rulesPostId', value: formData.rulesPostId || '' },
    { key: 'host', value: formData.host || '' },
    { key: 'organizer', value: formData.organizer || '' },
    { key: 'participants', value: formData.participants || '' },
    { key: 'registrationMethod', value: formData.registrationMethod || '' },
    { key: 'drawMethod', value: formData.drawMethod || '' },
    { key: 'equipment', value: formData.equipment || '' },
    { key: 'memo', value: formData.memo || '' },
    { key: 'entryFee', value: formData.entryFee?.toString() || '' },
    { key: 'bankAccount', value: formData.bankAccount || '' },
    { key: 'accountHolder', value: formData.accountHolder || '' },
    { key: 'clubJoinDate', value: formData.clubJoinDate || '' },
    { key: 'divisions', value: JSON.stringify(formData.divisions || []) },
    {
      key: 'openingCeremony',
      value: JSON.stringify(
        formData.openingCeremony || { isHeld: false, date: '', time: '', location: '' },
      ),
    },
    { key: 'status', value: status },
  ];

  fields.forEach(({ key, value }) => {
    formDataObj.append(key, value);
  });

  return formDataObj;
};

export default function EditTournamentPage({ params }: EditTournamentPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<TournamentFormData>(createInitialFormData());
  const [status, setStatus] = useState<string>('upcoming');
  const { loading, withLoading } = useLoading();
  const { tournament, isLoading: isLoadingTournament, error: tournamentError } = useTournament(id);

  // 대회 데이터를 폼 데이터로 변환
  const transformTournamentToFormData = useCallback(
    (tournament: Tournament): TournamentFormData => {
      return {
        title: tournament.title,
        startDate: formatDateForInput(tournament.startDate),
        endDate: formatDateForInput(tournament.endDate),
        location: tournament.location || '망원나들목테니스장 외 보조 경기장',
        tournamentType: tournament.tournamentType || 'individual',
        registrationStartDate: tournament.registrationStartDate
          ? formatDateForInput(tournament.registrationStartDate)
          : '',
        registrationDeadline: tournament.registrationDeadline
          ? formatDateForInput(tournament.registrationDeadline)
          : '',
        descriptionPostId: tournament.descriptionPostId || '',
        rulesPostId: tournament.rulesPostId || '',
        host: tournament.host || '마포구청, 마포구 체육회',
        organizer: tournament.organizer || '마포구테니스협회',
        participants: tournament.participants || '',
        registrationMethod: tournament.registrationMethod || '온라인접수',
        drawMethod: tournament.drawMethod || '',
        equipment: tournament.equipment || '낫소 볼',
        memo: tournament.memo || '',
        divisions: parseDivisions(tournament.divisions),
        entryFee: tournament.entryFee || 30000,
        bankAccount: tournament.bankAccount || '1001-8348-6182 (토스뱅크)',
        accountHolder: tournament.accountHolder || '허정학',
        clubJoinDate: tournament.clubJoinDate || '',
        openingCeremony: tournament.openingCeremony || {
          isHeld: false,
          date: '',
          time: '',
          location: '',
        },
      };
    },
    [],
  );

  // 대회 데이터가 로드되면 폼 데이터 설정
  useEffect(() => {
    if (tournament) {
      setFormData(transformTournamentToFormData(tournament));
      setStatus(tournament.status);
    }
  }, [tournament, transformTournamentToFormData]);

  // 폼 제출 처리
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const formDataObj = createFormData(formData, status);

        await withLoading(async () => {
          const response = await fetch(`/api/tournaments/${id}`, {
            method: 'PUT',
            body: formDataObj,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '대회 수정에 실패했습니다.');
          }

          return response.json();
        });

        router.push(`/tournaments/${id}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '대회 수정에 실패했습니다.';
        alert(errorMessage);
      }
    },
    [formData, status, id, withLoading, router],
  );

  // 로딩 상태
  if (isLoadingTournament) {
    return (
      <Container>
        <div>로딩 중...</div>
      </Container>
    );
  }

  // 에러 처리
  if (tournamentError) {
    return (
      <Container>
        <div>
          <p className="text-red-500">대회를 불러올 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  // 대회가 없는 경우
  if (!tournament) {
    return (
      <Container>
        <div>
          <p className="text-red-500">대회를 찾을 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <TournamentForm
        title="대회 수정"
        subtitle="대회 정보를 수정해주세요."
        submitButtonText="대회 수정"
        isSubmitting={loading}
        formData={formData}
        setFormData={setFormData}
        status={status}
        setStatus={setStatus}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
      />
    </Container>
  );
}

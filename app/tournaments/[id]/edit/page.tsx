'use client';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { use } from 'react';
import type { TournamentFormData } from '@/model/tournament';
import { useTournament, useUpdateTournament } from '@/hooks/useTournaments';
import { useLoading } from '@/hooks/useLoading';
import TournamentForm from '@/components/TournamentForm';
import {
  DIVISION_OPTIONS,
  getDefaultPrizes,
  getDefaultTeamCount,
  getDefaultStartTime,
} from '@/lib/tournamentUtils';

interface EditTournamentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditTournamentPage({ params }: EditTournamentPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState<TournamentFormData>({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    tournamentType: 'individual',
    registrationStartDate: '',
    registrationDeadline: '',
    descriptionPostId: '',
    rulesPostId: '',
    divisions: DIVISION_OPTIONS.map((option) => ({
      _key: option.value,
      division: option.value,
      teamCount: getDefaultTeamCount(option.value),
      matchDates: [],
      startTime: getDefaultStartTime(),
      prizes: getDefaultPrizes(option.value),
    })),
    entryFee: 30000,
    bankAccount: '1001-8348-6182 (토스뱅크)',
    accountHolder: '허정학',
  });
  const [status, setStatus] = useState<string>('upcoming');
  const { loading, withLoading } = useLoading();
  const { tournament, isLoading: isLoadingTournament, error: tournamentError } = useTournament(id);
  const { trigger: updateTournament, isMutating } = useUpdateTournament(id);

  // 대회 데이터가 로드되면 폼 데이터 설정
  useEffect(() => {
    if (tournament) {
      // divisions 데이터 파싱
      let parsedDivisions;
      if (tournament.divisions) {
        if (typeof tournament.divisions === 'string') {
          try {
            parsedDivisions = JSON.parse(tournament.divisions);
          } catch (error) {
            console.error('divisions 파싱 오류:', error);
            parsedDivisions = DIVISION_OPTIONS.map((option) => ({
              _key: option.value,
              division: option.value,
              teamCount: getDefaultTeamCount(option.value),
              matchDates: [],
              startTime: getDefaultStartTime(),
              prizes: getDefaultPrizes(option.value),
            }));
          }
        } else {
          parsedDivisions = tournament.divisions;
        }
      } else {
        parsedDivisions = DIVISION_OPTIONS.map((option) => ({
          _key: option.value,
          division: option.value,
          teamCount: getDefaultTeamCount(option.value),
          matchDates: [],
          startTime: getDefaultStartTime(),
          prizes: getDefaultPrizes(option.value),
        }));
      }

      setFormData({
        title: tournament.title,
        startDate: tournament.startDate.split('T')[0],
        endDate: tournament.endDate.split('T')[0],
        location: tournament.location,
        tournamentType: tournament.tournamentType || 'individual',
        registrationStartDate: tournament.registrationStartDate
          ? tournament.registrationStartDate.split('T')[0]
          : '',
        registrationDeadline: tournament.registrationDeadline
          ? tournament.registrationDeadline.split('T')[0]
          : '',
        descriptionPostId: tournament.descriptionPostId || '',
        rulesPostId: tournament.rulesPostId || '',
        divisions: parsedDivisions,
        entryFee: tournament.entryFee || 30000,
        bankAccount: tournament.bankAccount || '1001-8348-6182 (토스뱅크)',
        accountHolder: tournament.accountHolder || '허정학',
      });
      setStatus(tournament.status);
    }
  }, [tournament]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await withLoading(() =>
        updateTournament({
          ...formData,
          status,
          divisions: formData.divisions,
        }),
      );
      router.push(`/tournaments/${id}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('대회 수정에 실패했습니다.');
      }
    }
  };

  // 에러 처리
  if (tournamentError && !isLoadingTournament) {
    return (
      <Container>
        <div>
          <p className="text-red-500">대회를 불러올 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  if (!tournament) return null;

  return (
    <Container>
      <TournamentForm
        title="대회 수정"
        subtitle="대회 정보를 수정해주세요."
        submitButtonText="대회 수정"
        isSubmitting={isMutating}
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

'use client';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TournamentFormData } from '@/model/tournament';
import { useCreateTournament } from '@/hooks/useTournaments';
import { useLoading } from '@/hooks/useLoading';
import TournamentForm from '@/components/TournamentForm';
import { createDefaultTournamentFormData } from '@/lib/tournamentUtils';

export default function CreateTournamentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<TournamentFormData>(createDefaultTournamentFormData());
  const { loading, withLoading } = useLoading();
  const { trigger: createTournament, isMutating } = useCreateTournament();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 서버로 전송할 데이터 변환
    const submitData = {
      ...formData,
      divisions: formData.divisions, // 이미 올바른 구조로 되어 있음
    };

    try {
      await withLoading(() => createTournament(submitData));
      router.push('/tournaments');
    } catch {
      alert('대회 등록에 실패했습니다.');
    }
  };

  return (
    <Container>
      <TournamentForm
        title="대회 등록"
        subtitle="대회 정보를 입력해주세요."
        submitButtonText="대회 등록"
        isSubmitting={isMutating}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        loading={loading}
      />
    </Container>
  );
}

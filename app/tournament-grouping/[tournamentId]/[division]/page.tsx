'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ tournamentId: string; division: string }>;
}

export default function TournamentGroupingDetailPage({ params }: PageProps) {
  const router = useRouter();

  useEffect(() => {
    const loadParams = async () => {
      const { tournamentId, division } = await params;
      // 결과 페이지로 리다이렉트하면서 파라미터 전달
      router.replace(
        `/tournament-grouping/results?tournamentId=${tournamentId}&division=${division}`,
      );
    };

    loadParams();
  }, [params, router]);

  return null; // 리다이렉트 중에는 아무것도 렌더링하지 않음
}

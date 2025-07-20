import { useState } from 'react';

interface ValidationResult {
  ok: boolean;
  memberIndex?: number;
  isInfoValid?: boolean;
  validatedCount?: number;
}

export function useTournamentApplicationValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 개별 참가자 정보 검증
  const validateMember = async (
    applicationId: string,
    memberIndex: number,
  ): Promise<ValidationResult | null> => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch(`/api/tournament-applications/${applicationId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참가자 정보 검증에 실패했습니다.');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  // 모든 참가자 정보 일괄 검증
  const validateAllMembers = async (applicationId: string): Promise<ValidationResult | null> => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch(`/api/tournament-applications/${applicationId}/validate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '참가자 정보 일괄 검증에 실패했습니다.');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isValidating,
    error,
    validateMember,
    validateAllMembers,
  };
}

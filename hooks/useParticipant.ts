import { useState, useRef, useCallback } from 'react';
import type { ClubMember, ParticipantHookReturn } from '@/types/tournament';

export function useParticipant(
  searchClubMember: (
    name: string,
    clubId: string,
  ) => ClubMember | null | Promise<ClubMember | null>,
): ParticipantHookReturn {
  const [name, setName] = useState('');
  const [clubId, setClubId] = useState('');
  const [birth, setBirth] = useState('');
  const [score, setScore] = useState('');
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);
  const birthRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef<HTMLInputElement>(null);

  // 이름 변경 - 일반적인 사용자 입력용
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setIsRegistered(null);
  }, []);

  // 클럽 변경
  const handleClubChange = useCallback(
    async (clubId: string) => {
      setClubId(clubId);
      setIsRegistered(null);
      if (name && name.trim() !== '' && clubId) {
        const member = await searchClubMember(name.trim(), clubId);
        if (member) {
          setBirth(member.birth || '');
          setScore(member.score?.toString() || '');
          setIsRegistered(true);
        } else {
          setBirth('');
          setScore('');
          setIsRegistered(false);
        }
      }
    },
    [name, searchClubMember],
  );

  // 직접 설정 함수들 (초기 데이터 로딩용) - 추가 로직 없이 직접 설정
  const setNameDirect = useCallback((value: string) => {
    setName(value);
  }, []);

  const setBirthDirect = useCallback((value: string) => {
    setBirth(value);
  }, []);

  const setScoreDirect = useCallback((value: string) => {
    setScore(value);
  }, []);

  const setClubIdDirect = useCallback((value: string) => {
    setClubId(value);
  }, []);

  const setIsRegisteredDirect = useCallback((value: boolean) => {
    setIsRegistered(value);
  }, []);

  // 이름 blur 시 회원 검색
  const handleNameBlur = useCallback(async () => {
    if (name && name.trim() !== '' && clubId) {
      const member = await searchClubMember(name.trim(), clubId);
      if (member) {
        setBirth(member.birth || '');
        setScore(member.score?.toString() || '');
        setIsRegistered(true);
      } else {
        setBirth('');
        setScore('');
        setIsRegistered(false);
      }
    }
  }, [name, clubId, searchClubMember]);

  // 클럽 강제 설정 (단체전용)
  const setClubIdForced = useCallback((clubId: string) => {
    setClubId(clubId);
    setIsRegistered(null);
  }, []);

  return {
    name,
    setName: handleNameChange,
    setNameDirect,
    clubId,
    setClubId: handleClubChange,
    setClubIdDirect,
    setClubIdForced,
    birth,
    setBirth: (value: string) => {
      console.log('setBirth 호출:', value);
      setBirth(value);
    },
    setBirthDirect,
    score,
    setScore: (value: string) => {
      console.log('setScore 호출:', value);
      setScore(value);
    },
    setScoreDirect,
    isRegistered,
    setIsRegistered,
    setIsRegisteredDirect,
    nameRef,
    clubRef,
    birthRef,
    scoreRef,
    handleNameBlur,
  };
}

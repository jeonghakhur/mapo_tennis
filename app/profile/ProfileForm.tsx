'use client';
import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Flex,
  Text,
  RadioGroup,
  Card,
  Box,
  Separator,
  Select,
} from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import type { User } from '@/model/user';

export default function ProfileForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState('');
  const [score, setScore] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { data: session } = useSession();
  const email = session?.user?.email;
  const {
    data,
    isLoading,
    error: swrError,
    mutate,
  } = useSWR<{ user: User | null }>(
    email ? `/api/user/get-by-email?email=${encodeURIComponent(email)}` : null,
  );

  useEffect(() => {
    if (data && data.user) {
      setName(data.user.name || '');
      setPhone(data.user.phone || '');
      setGender(data.user.gender || '');
      setBirth(data.user.birth || '');
      setScore(data.user.score || '');
    } else if (data && !data.user && session?.user) {
      if (session.user.name) setName(session.user.name);
      if ((session.user as any).gender) setGender((session.user as any).gender);
      if ((session.user as any).birth) setBirth((session.user as any).birth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, session?.user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    seError('');
    setSuccess('');
    if (!name || !phone || !gender || !birth || !score) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }
    if (!/^\d{8}$/.test(birth)) {
      setError('생년월일은 8자리(YYYYMMDD)로 입력해 주세요.');
      return;
    }
    const res = await fetch('/api/user/complete-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, gender, birth, score, email: session?.user?.email }),
    });
    if (res.ok) {
      setSuccess('회원 정보가 성공적으로 수정되었습니다.');
      mutate();
    } else {
      setError('회원 정보 수정에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  if (isLoading) return <Text align="center">로딩 중...</Text>;
  if (swrError)
    return (
      <Text color="red" align="center">
        회원 정보 조회 중 오류가 발생했습니다.
      </Text>
    );

  return (
    <form onSubmit={handleSubmit}>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block', color: '#222' }}>
          실명
        </Text>
        <TextField.Root
          placeholder="실명을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="3"
          radius="large"
          required
        />
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block', color: '#222' }}>
          핸드폰번호
        </Text>
        <TextField.Root
          placeholder="01012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          size="3"
          radius="large"
          required
        />
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block', color: '#222' }}>
          성별
        </Text>
        <RadioGroup.Root value={gender} onValueChange={setGender} required>
          <Flex gap="4" mt="2">
            <RadioGroup.Item value="male" id="male" />
            <Text as="label" htmlFor="male">
              남성
            </Text>
            <RadioGroup.Item value="female" id="female" />
            <Text as="label" htmlFor="female">
              여성
            </Text>
          </Flex>
        </RadioGroup.Root>
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block', color: '#222' }}>
          생년월일(8자리)
        </Text>
        <TextField.Root
          placeholder="19900101"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          size="3"
          radius="large"
          required
        />
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block', color: '#222' }}>
          점수(1~10점)
        </Text>
        <Select.Root value={score} onValueChange={setScore} required size="3">
          <Select.Trigger placeholder="점수를 선택하세요" />
          <Select.Content>
            {[...Array(10)].map((_, i) => (
              <Select.Item key={i + 1} value={String(i + 1)}>
                {i + 1}점
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block', color: '#222' }}>
          이메일
        </Text>
        <Text
          size="3"
          style={{
            color: '#666',
            background: '#f5f5f5',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'block',
          }}
        >
          {session?.user?.email || ''}
        </Text>
      </Box>
      {error && (
        <Text color="red" mb="3">
          {error}
        </Text>
      )}
      {success && (
        <Text color="green" mb="3">
          {success}
        </Text>
      )}
      <Button type="submit" style={{ marginTop: 16, width: '100%' }} size="4" radius="large">
        회원 정보 수정
      </Button>
    </form>
  );
}

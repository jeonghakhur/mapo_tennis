'use client';
import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Flex,
  Text,
  RadioGroup,
  Box,
  Select,
  Separator,
} from '@radix-ui/themes';
import { signOut, useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import SkeletonCard from '@/components/SkeletonCard';
import Container from '@/components/Container';
import { isHydrating } from '@/lib/isHydrating';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';

export default function ProfileForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState('');
  const [score, setScore] = useState(''); // string으로 관리
  const [address, setAddress] = useState(''); // 주소(선택)
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { data: session } = useSession();
  const email = session?.user?.email;
  const { user, isLoading, error: swrError } = useUser(email);
  const { loading, withLoading } = useLoading();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender || '');
      setBirth(user.birth || '');
      setScore(user.score ? String(user.score) : '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !phone || !gender || !birth || !score) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }
    if (!/^\d{8}$/.test(birth)) {
      setError('생년월일은 8자리(YYYYMMDD)로 입력해 주세요.');
      return;
    }
    try {
      await withLoading(async () => {
        const response = await fetch('/api/user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            phone,
            gender,
            birth,
            score: Number(score),
            email: session?.user?.email,
            address,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '회원 정보 수정에 실패했습니다.');
        }

        setSuccess('회원 정보가 성공적으로 수정되었습니다.');
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '회원 정보 수정 중 오류가 발생했습니다.');
    }
  };

  if (swrError)
    return (
      <Text color="red" align="center">
        회원 정보 조회 중 오류가 발생했습니다.
      </Text>
    );

  const hydrating = isHydrating(isLoading, user);

  return (
    <Container>
      {hydrating ? (
        <SkeletonCard lines={4} />
      ) : (
        <form onSubmit={handleSubmit}>
          {loading && <LoadingOverlay size="3" />}
          <Box>
            <Text size="5" weight="bold" align="center" mb="4" mr="2">
              프로필 정보 수정
            </Text>
            <Text size="2" align="center" mb="5">
              회원 정보를 수정할 수 있습니다.
            </Text>
            <Separator my="4" size="4" />
          </Box>
          <Box mb="4">
            <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
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
          <Box mb="4">
            <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
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
            <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
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
            <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
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
            <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
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
            <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
              점수(1~10점)
            </Text>
            <Select.Root
              required
              size="3"
              value={score}
              onValueChange={(v) => {
                if (v !== '') {
                  setScore(v);
                }
              }}
            >
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
            <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
              주소 (선택)
            </Text>
            <TextField.Root
              placeholder="주소를 입력하세요(구/동 까지만 입력)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              size="3"
              radius="large"
            />
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
          <Box className="btn-wrap">
            <Button variant="outline" size="3" onClick={() => signOut({ callbackUrl: '/' })}>
              로그아웃
            </Button>
            <Button type="submit" size="3" radius="large">
              회원 정보 수정
            </Button>
          </Box>
        </form>
      )}
    </Container>
  );
}

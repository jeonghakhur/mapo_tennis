'use client';
import { useEffect, useState } from 'react';
import {
  Button,
  TextField,
  Flex,
  Text,
  RadioGroup,
  Box,
  Separator,
  Select,
} from '@radix-ui/themes';
import { useSession } from 'next-auth/react';
import AlreadyRegisteredDialog from './AlreadyRegisteredDialog';
import { useUser } from '@/hooks/useUser';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState('');
  const [score, setScore] = useState('');
  const [address, setAddress] = useState(''); // 주소(선택)
  const [error, setError] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { data: session } = useSession();
  const email = session?.user?.email;

  const { loading, withLoading } = useLoading();

  // SWR 훅으로 회원 존재 여부 확인
  const { user, isLoading: userLoading } = useUser(email);

  useEffect(() => {
    setAlreadyRegistered(!!user);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !gender || !birth || !score) {
      setError('모든 항목을 입력해 주세요.');
      return;
    }
    if (!/^[0-9]{8}$/.test(birth)) {
      setError('생년월일은 8자리(YYYYMMDD)로 입력해 주세요.');
      return;
    }
    setError('');
    try {
      await withLoading(async () => {
        const response = await fetch('/api/user', {
          method: 'POST',
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
          throw new Error(errorData.error || '회원가입에 실패했습니다.');
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <Box p="5">
      {alreadyRegistered && <AlreadyRegisteredDialog open={!!alreadyRegistered} />}
      {session?.user?.email && !userLoading && !alreadyRegistered && (
        <>
          {loading && <LoadingOverlay size="3" />}
          <Text size="5" weight="bold" align="center" mb="4" mr="2" as="div">
            회원가입정보입력
          </Text>
          <Text size="2" align="center" mb="5" as="div">
            서비스 이용을 위해 아래 정보를 입력해 주세요.
          </Text>
          <Separator my="4" size="4" />
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
                height: '40px',
              }}
            >
              {session?.user?.email || ''}
            </Text>
          </Box>
          <form onSubmit={handleSubmit}>
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
            <Button
              type="submit"
              style={{ marginTop: 16, width: '100%' }}
              size="4"
              radius="large"
              disabled={loading}
            >
              {loading ? '가입 중...' : '회원가입 완료'}
            </Button>
          </form>
        </>
      )}
    </Box>
  );
}

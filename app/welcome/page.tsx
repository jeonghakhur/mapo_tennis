'use client';
import { useState } from 'react';
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
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState('');
  const [score, setScore] = useState('');
  const [address, setAddress] = useState(''); // 주소(선택)
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      body: JSON.stringify({
        name,
        phone,
        gender,
        birth,
        score,
        email: session?.user?.email,
        address,
      }),
    });
    if (res.ok) {
      router.push('/signup-success');
    } else {
      setError('회원가입에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <Box p="6" width="100%">
      {!session?.user ? (
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
      ) : (
        <>
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
          <Text size="5" weight="bold" align="center" mb="4" mr="2">
            추가 정보 입력
          </Text>
          <Text size="2" align="center" mb="5">
            서비스 이용을 위해 아래 정보를 입력해 주세요.
          </Text>
          <Separator my="4" size="4" />
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
            <Button type="submit" style={{ marginTop: 16, width: '100%' }} size="4" radius="large">
              회원가입 완료
            </Button>
          </form>
        </>
      )}
    </Box>
  );
}

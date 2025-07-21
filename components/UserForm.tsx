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
import ClubSelector from './ClubSelector';
import type { ButtonProps } from '@radix-ui/themes';

interface UserFormProps {
  user: {
    name?: string;
    email?: string;
    phone?: string;
    gender?: string;
    birth?: string;
    score?: number;
    address?: string;
    clubs?: { _ref: string }[];
  } | null;
  onSubmit: (data: {
    name: string;
    email?: string;
    phone: string;
    gender: string;
    birth: string;
    score: number;
    address?: string;
    clubs: string[];
  }) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
  submitText?: string;
  isNameEntered?: boolean;
  onNameBlur?: () => void;
  submitButtonProps?: Partial<ButtonProps>;
}

export default function UserForm({
  user,
  onSubmit,
  loading = false,
  disabled = false,
  showLogout = false,
  onLogout,
  submitText = '회원 정보 수정',
  isNameEntered = true,
  onNameBlur,
  submitButtonProps,
}: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState('');
  const [score, setScore] = useState('');
  const [address, setAddress] = useState('');
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setGender(user.gender || '');
      setBirth(user.birth || '');
      setScore(user.score ? String(user.score) : '');
      setAddress(user.address || '');
      setSelectedClubIds(user.clubs?.map((club) => club._ref) || []);
    }
  }, [user]);

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
    await onSubmit({
      name,
      email,
      phone,
      gender,
      birth,
      score: Number(score),
      address,
      clubs: selectedClubIds,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box>
        <Text size="5" weight="bold" align="center" mb="4" mr="2">
          회원 정보 수정
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
          {email}
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
          onBlur={onNameBlur}
          size="3"
          radius="large"
          required
          disabled={disabled}
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
          disabled={disabled}
        />
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
          성별
        </Text>
        <RadioGroup.Root value={gender} onValueChange={setGender} required disabled={disabled}>
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
          disabled={disabled}
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
          disabled={disabled}
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
          disabled={disabled}
        />
      </Box>
      <Box mb="4">
        <ClubSelector
          userName={name}
          selectedClubIds={selectedClubIds}
          onClubsChange={setSelectedClubIds}
          disabled={loading || disabled}
          isNameEntered={isNameEntered}
        />
      </Box>
      {error && (
        <Text color="red" mb="3">
          {error}
        </Text>
      )}
      <Box className="btn-wrap">
        {showLogout && onLogout && (
          <Button variant="outline" size="3" onClick={onLogout} disabled={disabled}>
            로그아웃
          </Button>
        )}
        <Button type="submit" size="3" disabled={disabled || loading} {...submitButtonProps}>
          {submitText}
        </Button>
      </Box>
    </form>
  );
}

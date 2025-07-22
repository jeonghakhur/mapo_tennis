import { useState, useEffect, useRef } from 'react';
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
import ConfirmDialog from '@/components/ConfirmDialog';

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
    approvedByAdmin?: boolean;
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
    approvedByAdmin?: boolean;
  }) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
  submitText?: string;
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
  submitButtonProps,
}: UserFormProps) {
  const [name, setName] = useState('');
  const [nameForClubSelector, setNameForClubSelector] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birth, setBirth] = useState('');
  const [score, setScore] = useState('');
  const [address, setAddress] = useState('');
  const [selectedClubIds, setSelectedClubIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [focusMoveFn, setFocusMoveFn] = useState<(() => void) | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLButtonElement>(null);
  const birthRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef<HTMLButtonElement>(null);

  // 최초 마운트 시에만 상태 초기화
  useEffect(() => {
    if (user) {
      if (user.name) {
        setName(user.name);
        setNameForClubSelector(user.name);
      }
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.gender) setGender(user.gender);
      if (user.birth) setBirth(user.birth);
      if (user.score) setScore(String(user.score));
      if (user.address) setAddress(user.address);
      if (user.clubs) setSelectedClubIds(user.clubs.map((club) => club._ref));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name) {
      setError('이름을 입력해 주세요.');
      setFocusMoveFn(() => () => nameRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!phone) {
      setError('핸드폰번호를 입력해 주세요.');
      setFocusMoveFn(() => () => phoneRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!gender) {
      setError('성별을 선택해 주세요.');
      setFocusMoveFn(() => () => genderRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!birth) {
      setError('생년월일을 입력해 주세요.');
      setFocusMoveFn(() => () => birthRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!/^\d{4}$/.test(birth)) {
      setError('생년월일은 4자리(YYYY)로 입력해 주세요.');
      setFocusMoveFn(() => () => birthRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!score) {
      setError('점수를 선택해 주세요.');
      setFocusMoveFn(() => () => scoreRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    // 클럽 필수 유효성 검사 (회원가입 모드에서만)
    if (selectedClubIds.length === 0) {
      setError('가입할 클럽을 1개 이상 선택해 주세요.');
      setFocusMoveFn(null);
      setErrorDialogOpen(true);
      return;
    }
    setFocusMoveFn(null);
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
    <form onSubmit={handleSubmit} noValidate>
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
          ref={nameRef}
          placeholder="실명을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name) {
              setNameForClubSelector(name);
            }
          }}
          size="3"
          radius="large"
        />
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
          핸드폰번호
        </Text>
        <TextField.Root
          ref={phoneRef}
          placeholder="01012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          size="3"
          radius="large"
        />
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
          성별
        </Text>
        <RadioGroup.Root value={gender} onValueChange={setGender}>
          <Flex gap="4" mt="2">
            <RadioGroup.Item value="male" id="male" ref={genderRef} />
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
          ref={birthRef}
          placeholder="19900101"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          size="3"
          radius="large"
        />
      </Box>
      <Box mb="4">
        <Text as="label" size="3" mb="2" style={{ display: 'block' }}>
          점수(1~10점)
        </Text>
        <Select.Root
          size="3"
          value={score}
          onValueChange={(v) => {
            if (v !== '') {
              setScore(v);
            }
          }}
        >
          <Select.Trigger placeholder="점수를 선택하세요" ref={scoreRef} />
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
      <Box mb="4">
        <ClubSelector
          userName={nameForClubSelector}
          selectedClubIds={selectedClubIds}
          onClubsChange={setSelectedClubIds}
          disabled={disabled || loading}
          isNameEntered={!!nameForClubSelector}
        />
      </Box>
      {errorDialogOpen && (
        <ConfirmDialog
          title="입력 오류"
          description={error}
          confirmText="확인"
          confirmColor="red"
          open={errorDialogOpen}
          onOpenChange={setErrorDialogOpen}
          onConfirm={() => {
            setErrorDialogOpen(false);
            if (focusMoveFn) {
              setTimeout(() => focusMoveFn(), 0);
              setFocusMoveFn(null);
            }
          }}
        />
      )}
      <Box className="btn-wrap">
        {showLogout && onLogout && (
          <Button variant="outline" size="3" onClick={onLogout}>
            로그아웃
          </Button>
        )}
        <Button type="submit" size="3" {...submitButtonProps}>
          {submitText}
        </Button>
      </Box>
    </form>
  );
}

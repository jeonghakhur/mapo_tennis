import { useState, useEffect, useRef } from 'react';
import {
  Button,
  TextField,
  Flex,
  Text,
  RadioGroup,
  Box,
  Select,
  Switch,
  Checkbox,
  Dialog,
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
    isApprovedUser?: boolean;
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
    isApprovedUser?: boolean;
  }) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
  submitText?: string;
  submitButtonProps?: Partial<ButtonProps>;
  isAdmin?: boolean;
  showAgreements?: boolean;
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
  isAdmin = false,
  showAgreements = false,
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
  const [isApprovedUser, setIsApprovedUser] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [focusMoveFn, setFocusMoveFn] = useState<(() => void) | null>(null);

  // 동의 체크박스 상태
  const [agreement1, setAgreement1] = useState(false);
  const [agreement2, setAgreement2] = useState(false);
  const [agreement3, setAgreement3] = useState(false);
  const [agreement4, setAgreement4] = useState(false);

  // 약관 dialog 상태
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [thirdPartyDialogOpen, setThirdPartyDialogOpen] = useState(false);

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
      if (user.isApprovedUser) setIsApprovedUser(user.isApprovedUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모든 필수 항목이 완료되었는지 확인하는 함수
  const isFormComplete = () => {
    // 기본 필수 항목 확인
    if (!name || !phone || !gender || !birth || !score || selectedClubIds.length === 0) {
      return false;
    }

    // 동의사항이 표시되는 경우 모든 동의 체크 확인
    if (showAgreements) {
      if (!agreement1 || !agreement2 || !agreement3 || !agreement4) {
        return false;
      }
    }

    return true;
  };

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

    // 동의 체크박스 검증 (회원가입 모드에서만)
    if (showAgreements) {
      if (!agreement1) {
        setError('서비스 이용약관에 동의해 주세요.');
        setFocusMoveFn(null);
        setErrorDialogOpen(true);
        return;
      }
      if (!agreement2) {
        setError('개인정보 수집 및 이용에 동의해 주세요.');
        setFocusMoveFn(null);
        setErrorDialogOpen(true);
        return;
      }
      if (!agreement3) {
        setError('대회 운영을 위한 제3자 정보 제공에 동의해 주세요.');
        setFocusMoveFn(null);
        setErrorDialogOpen(true);
        return;
      }
      if (!agreement4) {
        setError('만 19세 이상이며, 협회의 회원 가입 조건을 충족한다는 것에 동의해 주세요.');
        setFocusMoveFn(null);
        setErrorDialogOpen(true);
        return;
      }
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
      isApprovedUser,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="table-form">
        <table>
          <tbody>
            <tr>
              <th>이메일</th>
              <td>
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
              </td>
            </tr>
            <tr>
              <th>실명</th>
              <td>
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
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>핸드폰번호</th>
              <td>
                <TextField.Root
                  ref={phoneRef}
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>성별</th>
              <td>
                <RadioGroup.Root value={gender} onValueChange={setGender}>
                  <Flex gap="4" align="center">
                    <RadioGroup.Item value="남성" id="male" ref={genderRef} />
                    <Text as="label" htmlFor="male">
                      남성
                    </Text>
                    <RadioGroup.Item value="여성" id="female" />
                    <Text as="label" htmlFor="female">
                      여성
                    </Text>
                  </Flex>
                </RadioGroup.Root>
              </td>
            </tr>
            <tr>
              <th>출생년도</th>
              <td>
                <TextField.Root
                  ref={birthRef}
                  placeholder="1996"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>점수</th>
              <td>
                <Select.Root
                  size="3"
                  value={score}
                  onValueChange={(v) => {
                    if (v !== '') {
                      setScore(v);
                    }
                  }}
                >
                  <Select.Trigger
                    placeholder="점수를 선택하세요"
                    ref={scoreRef}
                    style={{ width: '100%' }}
                  />
                  <Select.Content>
                    {[...Array(10)].map((_, i) => (
                      <Select.Item key={i + 1} value={String(i + 1)}>
                        {i + 1}점
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </td>
            </tr>
            <tr>
              <th>주소 (선택)</th>
              <td>
                <TextField.Root
                  placeholder="주소를 입력하세요(구/동 까지만 입력)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>가입 클럽</th>
              <td>
                <ClubSelector
                  userName={nameForClubSelector}
                  selectedClubIds={selectedClubIds}
                  onClubsChange={setSelectedClubIds}
                  disabled={disabled || loading}
                  isNameEntered={!!nameForClubSelector}
                />
              </td>
            </tr>
            {isAdmin && (
              <tr>
                <th>회원 승인</th>
                <td>
                  <Flex align="center" gap="2">
                    <Switch
                      checked={isApprovedUser}
                      onCheckedChange={setIsApprovedUser}
                      disabled={disabled || loading}
                    />
                    <Text size="2" color="gray">
                      {isApprovedUser ? '승인됨' : '미승인'}
                    </Text>
                  </Flex>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 동의사항 문단 */}
      {showAgreements && (
        <Box mt="6">
          <Text size="4" weight="bold" mb="4" style={{ display: 'block' }}>
            동의사항
          </Text>

          <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Flex align="center" gap="2">
              <Checkbox
                checked={agreement1}
                onCheckedChange={(checked) => setAgreement1(checked as boolean)}
                disabled={disabled || loading}
                id="agreement1"
              />
              <Flex align="center" gap="2">
                <Text size="3" htmlFor="agreement1" as="label">
                  (필수) 서비스 이용약관에 동의합니다
                </Text>
                <Button
                  variant="ghost"
                  size="1"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsDialogOpen(true);
                  }}
                  style={{ color: '#3b82f6', textDecoration: 'underline' }}
                >
                  보기
                </Button>
              </Flex>
            </Flex>
            <Flex align="center" gap="2">
              <Checkbox
                checked={agreement2}
                onCheckedChange={(checked) => setAgreement2(checked as boolean)}
                disabled={disabled || loading}
                id="agreement2"
              />
              <Flex align="center" gap="2">
                <Text size="3" htmlFor="agreement2" as="label">
                  (필수) 개인정보 수집 및 이용에 동의합니다
                </Text>
                <Button
                  variant="ghost"
                  size="1"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPrivacyDialogOpen(true);
                  }}
                  style={{ color: '#3b82f6', textDecoration: 'underline' }}
                >
                  보기
                </Button>
              </Flex>
            </Flex>
            <Flex align="center" gap="2">
              <Checkbox
                checked={agreement3}
                onCheckedChange={(checked) => setAgreement3(checked as boolean)}
                disabled={disabled || loading}
                id="agreement3"
              />
              <Flex align="center" gap="2">
                <Text size="3" htmlFor="agreement3" as="label">
                  (필수) 대회 운영을 위한 제3자 정보 제공에 동의합니다
                </Text>
                <Button
                  variant="ghost"
                  size="1"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setThirdPartyDialogOpen(true);
                  }}
                  style={{ color: '#3b82f6', textDecoration: 'underline' }}
                >
                  보기
                </Button>
              </Flex>
            </Flex>
            <Flex align="center" gap="2">
              <Checkbox
                checked={agreement4}
                onCheckedChange={(checked) => setAgreement4(checked as boolean)}
                disabled={disabled || loading}
                id="agreement4"
              />
              <Text size="3" htmlFor="agreement4" as="label">
                (필수) 본인은 만 19세 이상이며, 협회의 회원 가입 조건을 충족합니다
              </Text>
            </Flex>
          </Box>
        </Box>
      )}

      {/* 약관 Dialog들 */}
      <Dialog.Root open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 600, maxHeight: 500, overflow: 'auto' }}>
          <Dialog.Title>서비스 이용약관</Dialog.Title>
          <Dialog.Description>
            <Box p="4" style={{ lineHeight: '1.8' }}>
              <Text
                size="4"
                weight="bold"
                style={{ display: 'block', marginBottom: '16px', textAlign: 'center' }}
              >
                마포구 테니스협회 서비스 이용약관
              </Text>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  제1조 (목적)
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  이 약관은 마포구 테니스협회(이하 &quot;협회&quot;)가 제공하는 웹사이트를 통한
                  회원가입 및 대회 참가 신청 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여,
                  회원과 협회 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  제2조 (회원가입 및 자격)
                </Text>
                <Text
                  size="3"
                  style={{ display: 'block', paddingLeft: '16px', marginBottom: '8px' }}
                >
                  ① 회원은 본 약관에 동의하고, 협회가 정한 절차에 따라 가입한 자를 말합니다.
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  ② 회원가입은 본인의 실명 및 정확한 정보를 기반으로 이루어져야 하며, 허위 정보 제공
                  시 회원 자격이 제한될 수 있습니다.
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  제3조 (서비스 내용)
                </Text>
                <Text
                  size="3"
                  style={{ display: 'block', paddingLeft: '16px', marginBottom: '8px' }}
                >
                  협회는 다음의 서비스를 제공합니다:
                </Text>
                <Box style={{ paddingLeft: '32px' }}>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    1. 테니스 대회 참가 신청 접수 및 운영
                  </Text>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    2. 협회 소식 및 공지사항 전달
                  </Text>
                  <Text size="3" style={{ display: 'block' }}>
                    3. 기타 협회가 제공하는 정보 및 서비스
                  </Text>
                </Box>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  제4조 (회원의 의무)
                </Text>
                <Text
                  size="3"
                  style={{ display: 'block', paddingLeft: '16px', marginBottom: '8px' }}
                >
                  ① 회원은 관련 법령 및 본 약관의 내용을 준수해야 합니다.
                </Text>
                <Text
                  size="3"
                  style={{ display: 'block', paddingLeft: '16px', marginBottom: '8px' }}
                >
                  ② 다음 행위를 금지합니다:
                </Text>
                <Box style={{ paddingLeft: '32px' }}>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    • 타인의 정보 도용
                  </Text>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    • 허위정보 입력
                  </Text>
                  <Text size="3" style={{ display: 'block' }}>
                    • 협회의 명예를 훼손하거나 운영을 방해하는 행위
                  </Text>
                </Box>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  제5조 (책임의 제한)
                </Text>
                <Text
                  size="3"
                  style={{ display: 'block', paddingLeft: '16px', marginBottom: '8px' }}
                >
                  협회는 다음의 경우 책임을 지지 않습니다:
                </Text>
                <Box style={{ paddingLeft: '32px' }}>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    1. 천재지변, 시스템 장애 등 불가항력적 사유
                  </Text>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    2. 회원의 귀책 사유로 인한 손해
                  </Text>
                  <Text size="3" style={{ display: 'block' }}>
                    3. 대회 중 발생한 개인적 부상이나 사고
                  </Text>
                </Box>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  제6조 (약관 변경)
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  협회는 본 약관을 변경할 수 있으며, 변경 시 웹사이트를 통해 공지합니다. 회원은 공지
                  후 계속 이용 시 변경 약관에 동의한 것으로 간주됩니다.
                </Text>
              </Box>

              <Box mt="6" pt="4" style={{ borderTop: '1px solid #e2e8f0' }}>
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  부칙
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  이 약관은 2025년 7월 22일부터 적용됩니다.
                </Text>
              </Box>
            </Box>
          </Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                닫기
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <Dialog.Content style={{ maxWidth: 600, maxHeight: 500, overflow: 'auto' }}>
          <Dialog.Title>개인정보 수집 및 이용 동의</Dialog.Title>
          <Dialog.Description>
            <Box p="4" style={{ lineHeight: '1.8' }}>
              <Text
                size="4"
                weight="bold"
                style={{ display: 'block', marginBottom: '16px', textAlign: 'center' }}
              >
                개인정보 수집 및 이용 동의서
              </Text>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  1. 수집 항목
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  <Text weight="bold" style={{ display: 'inline' }}>
                    필수:
                  </Text>{' '}
                  이름, 생년월일, 성별, 휴대전화번호, 이메일, 소속(클럽명)
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  2. 수집 목적
                </Text>
                <Box style={{ paddingLeft: '16px' }}>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    • 테니스 대회 참가 신청 접수 및 운영
                  </Text>
                  <Text size="3" style={{ display: 'block' }}>
                    • 참가자 확인, 경기편성, 공지사항 전달 등
                  </Text>
                </Box>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  3. 보유 및 이용 기간
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  수집일로부터 1년간 보관 후 파기 (단, 관련 법령에 따라 일정 기간 보존될 수 있음)
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  4. 동의 거부 권리 및 불이익
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  귀하는 개인정보 제공에 동의하지 않을 수 있으나, 이 경우 대회 신청이 불가능할 수
                  있습니다.
                </Text>
              </Box>

              <Box
                mt="6"
                pt="4"
                style={{
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                }}
              >
                <Text size="3" weight="bold" style={{ display: 'block', textAlign: 'center' }}>
                  본인은 위 내용을 충분히 이해하였으며,
                  <br /> 개인정보 수집 및 이용에 동의합니다.
                </Text>
              </Box>
            </Box>
          </Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                닫기
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={thirdPartyDialogOpen} onOpenChange={setThirdPartyDialogOpen}>
        <Dialog.Content style={{ maxWidth: 600, maxHeight: 500, overflow: 'auto' }}>
          <Dialog.Title>제3자 정보 제공 동의</Dialog.Title>
          <Dialog.Description>
            <Box p="4" style={{ lineHeight: '1.8' }}>
              <Text
                size="4"
                weight="bold"
                style={{ display: 'block', marginBottom: '16px', textAlign: 'center' }}
              >
                개인정보 제3자 제공 동의서
              </Text>

              <Box mb="4">
                <Text size="3" style={{ display: 'block', marginBottom: '16px' }}>
                  협회는 대회의 원활한 운영을 위하여 다음과 같이 개인정보를 제3자에게 제공할 수
                  있습니다.
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  1. 제공 받는 자
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  대회 주최측, 운영본부, 심판단 등 대회 운영에 직접 관여하는 기관 및 인원
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  2. 제공 항목
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  이름, 성별, 연락처, 클럽명, 대회 신청 내역
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  3. 제공 목적
                </Text>
                <Box style={{ paddingLeft: '16px' }}>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    • 대진표 작성
                  </Text>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    • 경기 진행
                  </Text>
                  <Text size="3" style={{ display: 'block', marginBottom: '4px' }}>
                    • 연락 및 안내
                  </Text>
                  <Text size="3" style={{ display: 'block' }}>
                    • 시상 명단 작성 등
                  </Text>
                </Box>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  4. 제공 기간
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  대회 종료 후 즉시 파기 (단, 일부 정보는 법령에 따라 일정 기간 보존될 수 있음)
                </Text>
              </Box>

              <Box mb="4">
                <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  5. 동의 거부 권리 및 불이익
                </Text>
                <Text size="3" style={{ display: 'block', paddingLeft: '16px' }}>
                  귀하는 제3자 제공에 동의하지 않을 권리가 있으나, 이 경우 대회 참가가 제한될 수
                  있습니다.
                </Text>
              </Box>

              <Box
                mt="6"
                pt="4"
                style={{
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                }}
              >
                <Text size="3" weight="bold" style={{ display: 'block', textAlign: 'center' }}>
                  본인은 위 내용을 확인하고 제3자 제공에 동의합니다.
                </Text>
              </Box>
            </Box>
          </Dialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                닫기
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

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

      <Box className="btn-wrap" mt="4">
        {showLogout && onLogout && (
          <Button variant="outline" size="3" onClick={onLogout}>
            로그아웃
          </Button>
        )}
        <Button
          type="submit"
          size="3"
          {...submitButtonProps}
          disabled={!isFormComplete() || disabled || loading}
          style={{
            ...submitButtonProps?.style,
            opacity: isFormComplete() ? 1 : 0.5,
            cursor: isFormComplete() ? 'pointer' : 'not-allowed',
          }}
        >
          {submitText}
        </Button>
      </Box>
    </form>
  );
}

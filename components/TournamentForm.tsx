'use client';
import {
  Box,
  Text,
  Button,
  Flex,
  TextField,
  Select,
  Heading,
  Checkbox,
  RadioGroup,
} from '@radix-ui/themes';
import { Save } from 'lucide-react';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { TournamentFormData } from '@/model/tournament';
import { usePostsByCategory } from '@/hooks/usePosts';
import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingOverlay from '@/components/LoadingOverlay';
import MarkdownEditor from '@/components/MarkdownEditor';

import {
  DIVISION_OPTIONS,
  DIVISION_DEFAULTS,
  DEFAULT_START_TIME,
  validateTournamentForm,
  generateDateRange,
  handleDivisionDetailChange,
  handleMatchDateChange,
  focusToField,
  handleInputChange,
} from '@/lib/tournamentUtils';

interface TournamentFormProps {
  // 기본 정보
  title: string;
  subtitle: string;
  submitButtonText: string;
  isSubmitting: boolean;

  // 폼 데이터
  formData: TournamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;

  // 상태 관리 (수정 페이지에서만 사용)
  status?: string;
  setStatus?: (status: string) => void;

  // 이벤트 핸들러
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;

  // 로딩 상태
  loading?: boolean;
}

// 기본 필드 렌더링 컴포넌트
const BasicField = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <tr>
    <th style={{ width: '100px' }}>
      <Text>
        {label}
        {required && ' *'}
      </Text>
    </th>
    <td>{children}</td>
  </tr>
);

// 개회식 필드 렌더링 컴포넌트
const OpeningCeremonyFields = ({
  formData,
  setFormData,
}: {
  formData: TournamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
}) => {
  const updateOpeningCeremony = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        openingCeremony: {
          ...prev.openingCeremony,
          isHeld: prev.openingCeremony?.isHeld || false,
          [field]: value,
        },
      }));
    },
    [setFormData],
  );

  return (
    <>
      <tr>
        <th>
          <Text>개회식 진행</Text>
        </th>
        <td>
          <Flex gap="3" align="center">
            <Checkbox
              id="openingCeremony"
              checked={formData.openingCeremony?.isHeld || false}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  openingCeremony: {
                    ...prev.openingCeremony,
                    isHeld: checked as boolean,
                  },
                }))
              }
            />
            <Text as="label" htmlFor="openingCeremony" size="3">
              개회식을 진행합니다
            </Text>
          </Flex>
        </td>
      </tr>

      {formData.openingCeremony?.isHeld && (
        <>
          <BasicField label="개회식 날짜">
            <TextField.Root
              size="3"
              type="date"
              value={formData.openingCeremony?.date || ''}
              onChange={(e) => updateOpeningCeremony('date', e.target.value)}
              min={formData.startDate || undefined}
              max={formData.endDate || undefined}
            />
          </BasicField>
          <BasicField label="개회식 시간">
            <TextField.Root
              size="3"
              type="time"
              value={formData.openingCeremony?.time || ''}
              onChange={(e) => updateOpeningCeremony('time', e.target.value)}
            />
          </BasicField>
          <BasicField label="개회식 장소">
            <TextField.Root
              size="3"
              value={formData.openingCeremony?.location || ''}
              onChange={(e) => updateOpeningCeremony('location', e.target.value)}
              placeholder="개회식 장소를 입력하세요"
            />
          </BasicField>
        </>
      )}
    </>
  );
};

// 참가부서별 상세 정보 컴포넌트
const DivisionDetails = ({
  formData,
  setFormData,
}: {
  formData: TournamentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>;
}) => {
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const dateRange = useMemo(
    () => generateDateRange(formData.startDate, formData.endDate),
    [formData.startDate, formData.endDate],
  );

  // 선택된 부서 목록을 메모이제이션
  const selectedDivisionKeys = useMemo(
    () => formData.divisions?.map((d) => d.division).join(',') || '',
    [formData.divisions],
  );

  // 초기 렌더링 및 formData.divisions 변경 시 선택된 부서들을 자동으로 열기
  useEffect(() => {
    if (selectedDivisionKeys) {
      const divisions = selectedDivisionKeys.split(',').filter(Boolean);
      if (divisions.length > 0) {
        setExpandedDivisions((prev) => {
          const newExpandedDivisions = { ...prev };
          divisions.forEach((divisionKey) => {
            // 아직 설정되지 않은 경우에만 true로 설정
            if (newExpandedDivisions[divisionKey] === undefined) {
              newExpandedDivisions[divisionKey] = true;
            }
          });
          return newExpandedDivisions;
        });
      }
    }
  }, [selectedDivisionKeys]);

  const toggleDivision = useCallback(
    (divisionValue: string) => {
      const isCurrentlySelected = formData.divisions?.some((d) => d.division === divisionValue);

      if (isCurrentlySelected) {
        // 체크박스 해제: divisions에서 제거
        setFormData((prev) => ({
          ...prev,
          divisions: prev.divisions?.filter((d) => d.division !== divisionValue) || [],
        }));
        setExpandedDivisions((prev) => ({
          ...prev,
          [divisionValue]: false,
        }));
      } else {
        // 체크박스 선택: divisions에 추가
        const newDivision = {
          _key: divisionValue,
          division: divisionValue,
          teamCount:
            DIVISION_DEFAULTS[divisionValue as keyof typeof DIVISION_DEFAULTS]?.teamCount || 0,
          matchDates: [],
          startTime: DEFAULT_START_TIME,
          prizes: DIVISION_DEFAULTS[divisionValue as keyof typeof DIVISION_DEFAULTS]?.prizes || {
            first: '',
            second: '',
            third: '',
          },
        };
        setFormData((prev) => ({
          ...prev,
          divisions: [...(prev.divisions || []), newDivision],
        }));
        setExpandedDivisions((prev) => ({
          ...prev,
          [divisionValue]: true,
        }));
      }
    },
    [formData.divisions, setFormData],
  );

  const renderDivisionField = (
    division: { value: string; label: string },
    details: {
      teamCount: number;
      startTime: string;
      prizes: { first: string; second: string; third: string };
      matchDates: string[];
    },
    isSelected: boolean,
  ) => (
    <div key={division.value} className="mb-4">
      <Flex gap="2" align="center">
        <Checkbox checked={isSelected} onCheckedChange={() => toggleDivision(division.value)} />
        <Text
          size="3"
          weight="bold"
          className="cursor-pointer"
          onClick={() => toggleDivision(division.value)}
        >
          {division.label}
        </Text>
      </Flex>

      {isSelected && expandedDivisions[division.value] && (
        <div className="table-form mt-4">
          <table>
            <tbody>
              <tr>
                <th style={{ width: '80px !important' }}>참가팀수 </th>
                <td>
                  <TextField.Root
                    size="3"
                    type="number"
                    min="1"
                    max="100"
                    value={details.teamCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 1 : parseInt(value);
                      handleDivisionDetailChange(
                        formData,
                        setFormData,
                        division.value,
                        'teamCount',
                        isNaN(numValue) ? 1 : numValue,
                      );
                    }}
                    placeholder="팀 수 입력"
                  />
                </td>
              </tr>
              <tr>
                <th>시작 시간</th>
                <td>
                  <TextField.Root
                    size="3"
                    type="time"
                    value={details.startTime}
                    onChange={(e) =>
                      handleDivisionDetailChange(
                        formData,
                        setFormData,
                        division.value,
                        'startTime',
                        e.target.value,
                      )
                    }
                  />
                </td>
              </tr>

              {[
                { key: 'first', label: '우승 시상' },
                { key: 'second', label: '준우승 시상' },
                { key: 'third', label: '3위 시상' },
              ].map(({ key, label }) => (
                <tr key={key}>
                  <th>{label}</th>
                  <td>
                    <TextField.Root
                      size="3"
                      type="text"
                      value={details.prizes[key as keyof typeof details.prizes]}
                      onChange={(e) =>
                        handleDivisionDetailChange(
                          formData,
                          setFormData,
                          division.value,
                          key as 'first' | 'second' | 'third',
                          e.target.value,
                        )
                      }
                      placeholder="예: 500,000"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <th>시합일 선택</th>
                <td>
                  <Flex gap="3" wrap="wrap">
                    {dateRange.map((date) => (
                      <Flex key={date} gap="2" align="center">
                        <Checkbox
                          checked={((details.matchDates as string[]) || []).includes(date)}
                          onCheckedChange={(checked) =>
                            handleMatchDateChange(
                              formData,
                              setFormData,
                              division.value,
                              date,
                              checked as boolean,
                            )
                          }
                        />
                        <Text size="2">
                          {new Date(date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Text size="4" weight="bold" mb="3" className="block" mt="4">
        참가부서별 상세 정보
      </Text>
      <div className="space-y-4">
        {DIVISION_OPTIONS.map((division) => {
          const existingDetails = formData.divisions?.find((d) => d.division === division.value);
          const isSelected = !!existingDetails;
          const details = existingDetails || {
            _key: division.value,
            division: division.value,
            teamCount:
              DIVISION_DEFAULTS[division.value as keyof typeof DIVISION_DEFAULTS]?.teamCount || 0,
            matchDates: [],
            startTime: DEFAULT_START_TIME,
            prizes: DIVISION_DEFAULTS[division.value as keyof typeof DIVISION_DEFAULTS]?.prizes || {
              first: '',
              second: '',
              third: '',
            },
          };

          return renderDivisionField(division, details, isSelected);
        })}
      </div>
    </div>
  );
};

export default function TournamentForm({
  title,
  subtitle,
  submitButtonText,
  isSubmitting,
  formData,
  setFormData,
  status,
  setStatus,
  onSubmit,
  onCancel,
  loading = false,
}: TournamentFormProps) {
  // 필드 참조를 위한 refs
  const titleRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const registrationStartDateRef = useRef<HTMLInputElement>(null);
  const registrationDeadlineRef = useRef<HTMLInputElement>(null);

  // 알림 상태
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [focusField, setFocusField] = useState<string>('');

  const { posts: infoPosts, isLoading: isLoadingInfoPosts } =
    usePostsByCategory('tournament_rules');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 폼 검증 (divisions 검증 포함)
      const validation = validateTournamentForm(formData, true);
      if (!validation.isValid) {
        setAlertMessage(validation.message);
        setFocusField(validation.field);
        setShowAlert(true);
        return;
      }

      await onSubmit(e);
    },
    [formData, onSubmit],
  );

  const handleAlertConfirm = useCallback(() => {
    setShowAlert(false);
    // 다이얼로그가 완전히 닫힌 후 포커스 이동
    setTimeout(() => {
      focusToField(focusField, {
        titleRef,
        locationRef,
        startDateRef,
        registrationStartDateRef,
        registrationDeadlineRef,
      });
    }, 100);
  }, [focusField]);

  if (isLoadingInfoPosts) {
    return <SkeletonCard />;
  }

  return (
    <Box>
      {loading && <LoadingOverlay size="3" />}
      <Heading as="h2" size="4" mb="3">
        {title}
        <Text size="2" ml="1" color="gray">
          {subtitle}
        </Text>
      </Heading>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* 개회식 데이터를 FormData에 포함시키기 위한 숨겨진 필드들 */}
        <input
          type="hidden"
          name="openingCeremony"
          value={JSON.stringify(
            formData.openingCeremony || { isHeld: false, date: '', time: '', location: '' },
          )}
        />

        <div className="table-form">
          <table className="table-form">
            <tbody>
              <BasicField label="대회명" required>
                <TextField.Root
                  ref={titleRef}
                  size="3"
                  value={formData.title}
                  onChange={(e) => handleInputChange(setFormData, 'title', e.target.value)}
                  placeholder="대회명을 입력하세요"
                />
              </BasicField>

              <BasicField label="장소" required>
                <TextField.Root
                  ref={locationRef}
                  size="3"
                  value={formData.location}
                  onChange={(e) => handleInputChange(setFormData, 'location', e.target.value)}
                  placeholder="대회 장소를 입력하세요"
                />
              </BasicField>

              <BasicField label="참가인원">
                <TextField.Root
                  size="3"
                  value={formData.participants || ''}
                  onChange={(e) => handleInputChange(setFormData, 'participants', e.target.value)}
                  placeholder="예: 100명(남 60, 여 40)"
                />
              </BasicField>

              <BasicField label="주최">
                <TextField.Root
                  size="3"
                  value={formData.host || ''}
                  onChange={(e) => handleInputChange(setFormData, 'host', e.target.value)}
                  placeholder="주최 단체 또는 인물 입력"
                />
              </BasicField>

              <BasicField label="주관">
                <TextField.Root
                  size="3"
                  value={formData.organizer || ''}
                  onChange={(e) => handleInputChange(setFormData, 'organizer', e.target.value)}
                  placeholder="주관 단체 또는 인물 입력"
                />
              </BasicField>

              <BasicField label="접수방법">
                <TextField.Root
                  size="3"
                  value={formData.registrationMethod || ''}
                  onChange={(e) =>
                    handleInputChange(setFormData, 'registrationMethod', e.target.value)
                  }
                  placeholder="대회 접수 방법을 입력하세요"
                />
              </BasicField>

              <BasicField label="대진추첨">
                <TextField.Root
                  size="3"
                  value={formData.drawMethod || ''}
                  onChange={(e) => handleInputChange(setFormData, 'drawMethod', e.target.value)}
                  placeholder="대진 추첨 방법을 입력하세요"
                />
              </BasicField>

              <BasicField label="대회사용구">
                <TextField.Root
                  size="3"
                  value={formData.equipment || ''}
                  onChange={(e) => handleInputChange(setFormData, 'equipment', e.target.value)}
                  placeholder="대회에서 사용할 구기류를 입력하세요"
                />
              </BasicField>

              <tr>
                <th>
                  <Text>대회 유형 *</Text>
                </th>
                <td>
                  <RadioGroup.Root
                    value={formData.tournamentType}
                    onValueChange={(value) =>
                      handleInputChange(
                        setFormData,
                        'tournamentType',
                        value as 'individual' | 'team',
                      )
                    }
                  >
                    <Flex gap="3">
                      <Flex gap="2" align="center">
                        <RadioGroup.Item value="individual" id="individual" />
                        <Text as="label" htmlFor="individual" size="3">
                          개인전
                        </Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        <RadioGroup.Item value="team" id="team" />
                        <Text as="label" htmlFor="team" size="3">
                          단체전
                        </Text>
                      </Flex>
                    </Flex>
                  </RadioGroup.Root>
                </td>
              </tr>

              <BasicField label="시작일" required>
                <TextField.Root
                  ref={startDateRef}
                  size="3"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange(setFormData, 'startDate', e.target.value)}
                  max={formData.endDate || undefined}
                />
              </BasicField>

              <BasicField label="종료일">
                <TextField.Root
                  size="3"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange(setFormData, 'endDate', e.target.value)}
                  min={formData.startDate || undefined}
                />
              </BasicField>

              <BasicField label="등록 시작일" required>
                <TextField.Root
                  ref={registrationStartDateRef}
                  size="3"
                  type="date"
                  value={formData.registrationStartDate}
                  onChange={(e) =>
                    handleInputChange(setFormData, 'registrationStartDate', e.target.value)
                  }
                  max={formData.registrationDeadline || undefined}
                  required
                />
              </BasicField>

              <BasicField label="등록 마감일" required>
                <TextField.Root
                  ref={registrationDeadlineRef}
                  size="3"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) =>
                    handleInputChange(setFormData, 'registrationDeadline', e.target.value)
                  }
                  min={formData.registrationStartDate || undefined}
                  required
                />
              </BasicField>

              <OpeningCeremonyFields formData={formData} setFormData={setFormData} />

              <BasicField label="참가비">
                <TextField.Root
                  size="3"
                  type="number"
                  min="0"
                  value={formData.entryFee}
                  onChange={(e) =>
                    handleInputChange(setFormData, 'entryFee', parseInt(e.target.value) || 0)
                  }
                  placeholder="참가비 입력"
                />
              </BasicField>

              <BasicField label="입금계좌">
                <TextField.Root
                  size="3"
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange(setFormData, 'bankAccount', e.target.value)}
                  placeholder="입금계좌 입력"
                />
              </BasicField>

              <BasicField label="예금주">
                <TextField.Root
                  size="3"
                  value={formData.accountHolder}
                  onChange={(e) => handleInputChange(setFormData, 'accountHolder', e.target.value)}
                  placeholder="예금주 입력"
                />
              </BasicField>

              <BasicField label="클럽가입일">
                <TextField.Root
                  size="3"
                  type="date"
                  value={formData.clubJoinDate || ''}
                  onChange={(e) => handleInputChange(setFormData, 'clubJoinDate', e.target.value)}
                />
              </BasicField>

              <BasicField label="메모">
                <MarkdownEditor
                  value={formData.memo || ''}
                  onChange={(value) => handleInputChange(setFormData, 'memo', value)}
                />
              </BasicField>

              {/* 상태 필드 (수정 페이지에서만 표시) */}
              {status !== undefined && setStatus && (
                <tr>
                  <th>
                    <Text>대회 상태</Text>
                  </th>
                  <td>
                    <Select.Root
                      size="3"
                      value={status}
                      onValueChange={(v) => {
                        if (!v) return;
                        setStatus(v);
                      }}
                    >
                      <Select.Trigger placeholder="상태를 선택하세요" />
                      <Select.Content>
                        <Select.Item value="upcoming">예정</Select.Item>
                        <Select.Item value="ongoing">진행중</Select.Item>
                        <Select.Item value="completed">완료</Select.Item>
                        <Select.Item value="cancelled">취소</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DivisionDetails formData={formData} setFormData={setFormData} />

        {/* 포스트 링크 */}
        <div className="table-form">
          <table className="table-form">
            <tbody>
              <tr>
                <th>
                  <Text>대회 규칙</Text>
                </th>
                <td>
                  <Select.Root
                    size="3"
                    value={formData.rulesPostId || 'none'}
                    onValueChange={(value) => {
                      if (!value) return;
                      handleInputChange(setFormData, 'rulesPostId', value === 'none' ? '' : value);
                    }}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="none">선택 안함</Select.Item>
                      {infoPosts.map((post) => (
                        <Select.Item key={post._id} value={post._id}>
                          {post.title}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Flex gap="3" justify="end" className="btn-wrap">
          <Button type="button" variant="soft" onClick={onCancel} size="3">
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting} size="3">
            <Save size="16" />
            {isSubmitting ? '처리 중...' : submitButtonText}
          </Button>
        </Flex>
      </form>

      {/* 검증 알림 다이얼로그 */}
      <ConfirmDialog
        title="입력 오류"
        description={alertMessage}
        confirmText="확인"
        confirmVariant="solid"
        confirmColor="blue"
        open={showAlert}
        onOpenChange={setShowAlert}
        onConfirm={handleAlertConfirm}
        onCancel={() => setShowAlert(false)}
      />
    </Box>
  );
}

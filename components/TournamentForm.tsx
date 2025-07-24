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
import { useState, useRef } from 'react';
import type { TournamentFormData } from '@/model/tournament';
import { usePostsByCategory } from '@/hooks/usePosts';
import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

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
  canShowDivisionDetails,
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
  // 상세 정보 입력 상태
  const [showDivisionDetails, setShowDivisionDetails] = useState(false);

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

  // const { posts: schedulePosts, isLoading: isLoadingSchedulePosts } = usePostsByCategory('tournament_info');
  const { posts: infoPosts, isLoading: isLoadingInfoPosts } =
    usePostsByCategory('tournament_rules');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 검증
    const validation = validateTournamentForm(formData, showDivisionDetails);
    if (!validation.isValid) {
      setAlertMessage(validation.message);
      setFocusField(validation.field);
      setShowAlert(true);
      return;
    }

    await onSubmit(e);
  };

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
        <div className="table-form">
          <table className="table-form">
            <tbody>
              <tr>
                <th style={{ width: '100px' }}>대회명 *</th>
                <td>
                  <TextField.Root
                    ref={titleRef}
                    size="3"
                    value={formData.title}
                    onChange={(e) => handleInputChange(setFormData, 'title', e.target.value)}
                    placeholder="대회명을 입력하세요"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>장소 *</Text>
                </th>
                <td>
                  <TextField.Root
                    ref={locationRef}
                    size="3"
                    value={formData.location}
                    onChange={(e) => handleInputChange(setFormData, 'location', e.target.value)}
                    placeholder="대회 장소를 입력하세요"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>참가인원</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.participants || ''}
                    onChange={(e) => handleInputChange(setFormData, 'participants', e.target.value)}
                    placeholder="예: 100명(남 60, 여 40)"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>주최</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.host || ''}
                    onChange={(e) => handleInputChange(setFormData, 'host', e.target.value)}
                    placeholder="주최 단체 또는 인물 입력"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>주관</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.organizer || ''}
                    onChange={(e) => handleInputChange(setFormData, 'organizer', e.target.value)}
                    placeholder="주관 단체 또는 인물 입력"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>접수방법</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.registrationMethod || ''}
                    onChange={(e) =>
                      handleInputChange(setFormData, 'registrationMethod', e.target.value)
                    }
                    placeholder="대회 접수 방법을 입력하세요"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>대진추첨</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.drawMethod || ''}
                    onChange={(e) => handleInputChange(setFormData, 'drawMethod', e.target.value)}
                    placeholder="대진 추첨 방법을 입력하세요"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>대회사용구</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.equipment || ''}
                    onChange={(e) => handleInputChange(setFormData, 'equipment', e.target.value)}
                    placeholder="대회에서 사용할 구기류를 입력하세요"
                  />
                </td>
              </tr>

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
              <tr>
                <th>
                  <Text>시작일 *</Text>
                </th>
                <td>
                  <TextField.Root
                    ref={startDateRef}
                    size="3"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange(setFormData, 'startDate', e.target.value)}
                    max={formData.endDate || undefined}
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>종료일</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange(setFormData, 'endDate', e.target.value)}
                    min={formData.startDate || undefined}
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>등록 시작일 *</Text>
                </th>
                <td>
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
                </td>
              </tr>
              <tr>
                <th>
                  <Text>등록 마감일 *</Text>
                </th>
                <td>
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
                </td>
              </tr>

              <tr>
                <th>
                  <Text>참가비</Text>
                </th>
                <td>
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
                </td>
              </tr>
              <tr>
                <th>
                  <Text>입금계좌</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange(setFormData, 'bankAccount', e.target.value)}
                    placeholder="입금계좌 입력"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>예금주</Text>
                </th>
                <td>
                  <TextField.Root
                    size="3"
                    value={formData.accountHolder}
                    onChange={(e) =>
                      handleInputChange(setFormData, 'accountHolder', e.target.value)
                    }
                    placeholder="예금주 입력"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Text>메모</Text>
                </th>
                <td>
                  <SimpleEditor
                    value={formData.memo || ''}
                    onChange={(value) => handleInputChange(setFormData, 'memo', value)}
                    height="400px"
                    minHeight="300px"
                    maxHeight="600px"
                  />
                </td>
              </tr>
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

        {/* 참가부서별 상세 정보 입력 버튼 */}
        <Flex justify="center" mt="4">
          <Button
            type="button"
            size="3"
            variant={showDivisionDetails ? 'soft' : 'solid'}
            disabled={!canShowDivisionDetails(formData)}
            onClick={() => setShowDivisionDetails(!showDivisionDetails)}
          >
            {showDivisionDetails ? '상세 정보 숨기기' : '참가부서별 상세 정보 입력'}
          </Button>
        </Flex>

        {/* 참가부서별 상세 정보 */}
        {showDivisionDetails && (
          <div>
            <Text size="4" weight="bold" mb="3" className="block">
              참가부서별 상세 정보
            </Text>
            <div className="space-y-4">
              {DIVISION_OPTIONS.map((division) => {
                const existingDetails = formData.divisions?.find(
                  (d) => d.division === division.value,
                );
                const details = existingDetails || {
                  _key: division.value,
                  division: division.value,
                  teamCount:
                    DIVISION_DEFAULTS[division.value as keyof typeof DIVISION_DEFAULTS]
                      ?.teamCount || 0,
                  matchDates: [],
                  startTime: DEFAULT_START_TIME,
                  prizes: DIVISION_DEFAULTS[division.value as keyof typeof DIVISION_DEFAULTS]
                    ?.prizes || { first: 0, second: 0, third: 0 },
                };

                const dateRange = generateDateRange(formData.startDate, formData.endDate);

                return (
                  <div key={division.value} className="border rounded-lg p-4">
                    <Text size="3" weight="bold" mb="3" className="block">
                      {division.label}
                    </Text>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 참가팀수 */}
                      <div>
                        <Text size="2" weight="bold" className="block mb-2">
                          참가팀수 *
                        </Text>
                        <TextField.Root
                          size="3"
                          type="number"
                          min="0"
                          max="100"
                          value={details.teamCount}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === '' ? 0 : parseInt(value);
                            handleDivisionDetailChange(
                              formData,
                              setFormData,
                              division.value,
                              'teamCount',
                              isNaN(numValue) ? 0 : numValue,
                            );
                          }}
                          placeholder="팀 수 입력"
                        />
                      </div>

                      {/* 시작 시간 */}
                      <div>
                        <Text size="2" weight="bold" className="block mb-2">
                          시작 시간 *
                        </Text>
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
                          disabled={details.teamCount === 0}
                        />
                      </div>

                      {/* 시상금 */}
                      <div>
                        <Text size="2" weight="bold" className="block mb-2">
                          우승상금
                        </Text>
                        <TextField.Root
                          size="3"
                          type="number"
                          min="0"
                          value={details.prizes.first}
                          onChange={(e) =>
                            handleDivisionDetailChange(
                              formData,
                              setFormData,
                              division.value,
                              'first',
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="금액 입력"
                          disabled={details.teamCount === 0}
                        />
                      </div>

                      <div>
                        <Text size="2" weight="bold" className="block mb-2">
                          준우승상금
                        </Text>
                        <TextField.Root
                          size="3"
                          type="number"
                          min="0"
                          value={details.prizes.second}
                          onChange={(e) =>
                            handleDivisionDetailChange(
                              formData,
                              setFormData,
                              division.value,
                              'second',
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="금액 입력"
                          disabled={details.teamCount === 0}
                        />
                      </div>

                      <div>
                        <Text size="2" weight="bold" className="block mb-2">
                          3위상금
                        </Text>
                        <TextField.Root
                          size="3"
                          type="number"
                          min="0"
                          value={details.prizes.third}
                          onChange={(e) =>
                            handleDivisionDetailChange(
                              formData,
                              setFormData,
                              division.value,
                              'third',
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="금액 입력"
                          disabled={details.teamCount === 0}
                        />
                      </div>
                    </div>

                    {/* 시합일 체크박스 */}
                    <div className="mt-4">
                      <Text size="2" weight="bold" className="block mb-2">
                        시합일 선택 *
                      </Text>
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
                              disabled={details.teamCount === 0}
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 포스트 링크 */}
        <div className="table-form">
          <table className="table-form">
            <tbody>
              {/* <tr>
                <th>
                  <Text>대회 요강</Text>
                </th>
                <td>
                  <Select.Root
                    size="3"
                    value={formData.descriptionPostId || 'none'}
                    onValueChange={(value) => {
                      if (!value) return;
                      handleInputChange(
                        setFormData,
                        'descriptionPostId',
                        value === 'none' ? '' : value,
                      );
                    }}
                  >
                    <Select.Trigger placeholder="대회 설명 포스트를 선택하세요" />
                    <Select.Content>
                      <Select.Item value="none">선택하지 않음</Select.Item>
                      {schedulePosts.map((post) => (
                        <Select.Item key={post._id} value={post._id}>
                          {post.title}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </td>
              </tr> */}
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
        onConfirm={() => {
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
        }}
        onCancel={() => setShowAlert(false)}
      />
    </Box>
  );
}

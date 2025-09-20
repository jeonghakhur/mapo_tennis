'use client';
import { Text, Button, TextField, Flex, Select, RadioGroup } from '@radix-ui/themes';
import Link from 'next/link';
import { useState } from 'react';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useClubs } from '@/hooks/useClubs';
import { createClubMemberRequest } from '@/hooks/useClubMembers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Container from '@/components/Container';
import SkeletonCard from '@/components/SkeletonCard';
import { Combobox } from '@/components/ui/combobox';
import { wrapTextWithSpans } from '@/lib/utils';

function ClubMemberCreateInner() {
  const { clubs, isLoading: clubsLoading } = useClubs();
  const [form, setForm] = useState({
    user: '',
    club: '',
    role: '회원',
    gender: '',
    contact: '',
    birth: '',
    tennisStartYear: '',
    email: '',
    score: '',
    status: '정회원',
    joinedAt: '',
  });
  const { loading, withLoading } = useLoading();
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubIdFromQuery = searchParams.get('id') || '';

  const handleChange = (field: string, value: string) => {
    // 클럽 상세에서 진입한 경우 club 필드는 변경 불가
    if (field === 'club' && clubIdFromQuery) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 클럽 상세에서 진입한 경우 club 값을 고정
  useState(() => {
    if (clubIdFromQuery && form.club !== clubIdFromQuery) {
      setForm((prev) => ({ ...prev, club: clubIdFromQuery }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.user || !form.club) {
      setError('이름과 클럽은 필수입니다.');
      return;
    }
    await withLoading(async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        await createClubMemberRequest({
          ...form,
          club: { _ref: form.club, _type: 'reference' },
          score: form.score ? Number(form.score) : undefined,
          joinedAt: today,
        });
        router.push(`/club/${form.club}`);
      } catch (e) {
        setError('등록 실패: ' + (e instanceof Error ? e.message : e));
      }
    });
  };

  return (
    <Container>
      {clubsLoading ? (
        <SkeletonCard />
      ) : (
        <>
          {loading && <LoadingOverlay size="3" />}
          <Text size="6" weight="bold" mb="4" as="div">
            클럽회원 등록
          </Text>
          <form onSubmit={handleSubmit}>
            <div className="table-form">
              <table className="table-form">
                <tbody>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('이름')}
                      </Flex>
                    </th>
                    <td>
                      <TextField.Root
                        id="user-input"
                        size="3"
                        placeholder="이름"
                        value={form.user}
                        onChange={(e) => handleChange('user', e.target.value)}
                        required
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('클럽')}
                      </Flex>
                    </th>
                    <td>
                      {clubIdFromQuery ? (
                        <TextField.Root
                          id="club-input"
                          size="3"
                          value={clubs.find((c) => c._id === clubIdFromQuery)?.name || ''}
                          readOnly
                          required
                        />
                      ) : (
                        <Combobox
                          options={clubs
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                            .map((club) => ({ value: club._id || '', label: club.name }))}
                          value={form.club}
                          onValueChange={(v) => handleChange('club', v)}
                          placeholder="클럽 선택"
                        />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('직위')}
                      </Flex>
                    </th>
                    <td>
                      <Select.Root
                        size="3"
                        value={form.role}
                        onValueChange={(v) => {
                          if (!v) return;
                          handleChange('role', v);
                        }}
                      >
                        <Select.Trigger id="role-select" placeholder="직위 선택" />
                        <Select.Content>
                          <Select.Item value="회장">회장</Select.Item>
                          <Select.Item value="부회장">부회장</Select.Item>
                          <Select.Item value="총무">총무</Select.Item>
                          <Select.Item value="고문">고문</Select.Item>
                          <Select.Item value="경기이사">경기이사</Select.Item>
                          <Select.Item value="회원">회원</Select.Item>
                          <Select.Item value="기타">기타</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('성별')}
                      </Flex>
                    </th>
                    <td>
                      <RadioGroup.Root
                        value={form.gender}
                        onValueChange={(v: string) => handleChange('gender', v)}
                        id="gender-radio"
                        aria-label="성별"
                        style={{ gap: 8 }}
                      >
                        <RadioGroup.Item value="남" id="gender-male">
                          남
                        </RadioGroup.Item>
                        <RadioGroup.Item value="여" id="gender-female">
                          여
                        </RadioGroup.Item>
                      </RadioGroup.Root>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('연락처')}
                      </Flex>
                    </th>
                    <td>
                      <TextField.Root
                        type="tel"
                        id="contact-input"
                        size="3"
                        placeholder="연락처"
                        value={form.contact}
                        onChange={(e) => {
                          const value = e.target.value;
                          // 숫자만 입력 허용
                          if (/^\d*$/.test(value)) {
                            handleChange('contact', value);
                          }
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('출생년도')}
                      </Flex>
                    </th>
                    <td>
                      <TextField.Root
                        type="text"
                        inputMode="numeric"
                        pattern="\d{1,4}"
                        id="birth-input"
                        size="3"
                        maxLength={4}
                        placeholder="출생년도(4자리)"
                        value={form.birth}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('입문년도')}
                      </Flex>
                    </th>
                    <td>
                      <TextField.Root
                        type="text"
                        inputMode="numeric"
                        pattern="\d{1,4}"
                        id="tennisStartYear-input"
                        size="3"
                        maxLength={4}
                        placeholder="입문년도(4자리)"
                        value={form.tennisStartYear}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('이메일')}
                      </Flex>
                    </th>
                    <td>
                      <TextField.Root
                        id="email-input"
                        size="3"
                        placeholder="이메일"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('점수')}
                      </Flex>
                    </th>
                    <td>
                      <TextField.Root
                        type="text"
                        id="score-input"
                        size="3"
                        placeholder="점수(숫자)"
                        value={form.score}
                        onChange={(e) => {
                          const value = e.target.value;
                          // 숫자만 입력 허용
                          if (/^\d*$/.test(value)) {
                            handleChange('score', value);
                          }
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <Flex justify="between" align="center" flexGrow="1">
                        {wrapTextWithSpans('회원상태')}
                      </Flex>
                    </th>
                    <td>
                      <RadioGroup.Root
                        value={form.status}
                        onValueChange={(v: string) => handleChange('status', v)}
                        id="status-radio"
                        aria-label="회원상태"
                        style={{ gap: 8 }}
                      >
                        <RadioGroup.Item value="정회원" id="status-active">
                          정회원
                        </RadioGroup.Item>
                        <RadioGroup.Item value="휴회원" id="status-rest">
                          휴회원
                        </RadioGroup.Item>
                        <RadioGroup.Item value="탈퇴회원" id="status-leave">
                          탈퇴회원
                        </RadioGroup.Item>
                      </RadioGroup.Root>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {error && <Text color="red">{error}</Text>}
            <Flex gap="2" mt="3">
              <Button type="submit" className="!flex-1" size="3">
                등록
              </Button>
              <Button
                asChild
                variant="soft"
                color="gray"
                type="button"
                className="!flex-1"
                size="3"
              >
                <Link href="/club-member">취소</Link>
              </Button>
            </Flex>
          </form>
        </>
      )}
    </Container>
  );
}

export default function ClubMemberCreatePage() {
  return (
    <Suspense>
      <ClubMemberCreateInner />
    </Suspense>
  );
}

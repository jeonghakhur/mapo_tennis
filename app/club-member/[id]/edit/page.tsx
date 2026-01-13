'use client';
import { Text, Button, TextField, Flex, Select, RadioGroup } from '@radix-ui/themes';
import { AlertDialog } from '@radix-ui/themes';
import { useState, useEffect } from 'react';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import {
  useClubMember,
  updateClubMemberRequest,
  deleteClubMemberRequest,
} from '@/hooks/useClubMembers';
import { useRouter, useSearchParams } from 'next/navigation';
import Container from '@/components/Container';
import React from 'react';
import SkeletonCard from '@/components/SkeletonCard';
import { Combobox } from '@/components/ui/combobox';
import { useClubs } from '@/hooks/useClubs';
import { wrapTextWithSpans } from '@/lib/utils';

export default function ClubMemberEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { member, isLoading: memberLoading } = useClubMember(id);
  const { clubs } = useClubs();
  const [form, setForm] = useState({
    user: '',
    club: '',
    role: '',
    gender: '',
    contact: '',
    birth: '',
    tennisStartYear: '',
    email: '',
    score: '',
    status: '정회원',
    leftAt: '',
  });
  const { loading, withLoading } = useLoading();
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 이전 페이지에 따라 리다이렉트 경로 결정
  const getReturnPath = () => {
    const returnTo = searchParams.get('returnTo');

    // 쿼리 파라미터가 있으면 우선 사용
    if (returnTo === 'club-member') {
      return '/club-member';
    } else if (returnTo === 'club') {
      return `/club/${member?.club?._id || form.club}`;
    }

    // 쿼리 파라미터가 없으면 referrer 확인
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      if (referrer.includes('/club-member')) {
        return '/club-member';
      } else if (referrer.includes('/club/')) {
        return `/club/${member?.club?._id || form.club}`;
      }
    }

    // 기본값: club 페이지로 이동
    return `/club/${member?.club?._id || form.club}`;
  };

  useEffect(() => {
    if (member) {
      // 성별 값 정규화: '남'/'남성' → '남', '여'/'여성' → '여'
      let normalizedGender = member.gender || '';
      if (normalizedGender === '남성') {
        normalizedGender = '남';
      } else if (normalizedGender === '여성') {
        normalizedGender = '여';
      }

      setForm({
        user: member.user || '',
        club: member.club?._id || '', // name → _ref로 변경
        role: member.role || '',
        gender: normalizedGender,
        contact: member.contact || '',
        birth: member.birth || '',
        tennisStartYear: member.tennisStartYear || '',
        email: member.email || '',
        score: member.score ? String(member.score) : '',
        status: member.status || '정회원',
        leftAt: member.leftAt || '',
      });
    }
    console.log(member);
  }, [member]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      if (field === 'status' && value === '탈퇴회원') {
        const today = new Date().toISOString().slice(0, 10);
        return { ...prev, [field]: value, leftAt: today };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.user || !form.club) {
      setError('이름과 클럽은 필수입니다.');
      return;
    }
    await withLoading(async () => {
      try {
        await updateClubMemberRequest(id, {
          ...form,
          club: { _ref: form.club, _type: 'reference' },
          score: form.score ? Number(form.score) : undefined,
        });
        router.push(getReturnPath());
      } catch (e) {
        setError('수정 실패: ' + (e instanceof Error ? e.message : e));
      }
    });
  };

  const handleDelete = async () => {
    setError('');
    await withLoading(async () => {
      try {
        await deleteClubMemberRequest(id);
        router.push(getReturnPath());
      } catch (e) {
        setError('삭제 실패: ' + (e instanceof Error ? e.message : e));
      }
      setDeleteDialogOpen(false);
    });
  };

  return (
    <Container>
      {memberLoading ? (
        <SkeletonCard />
      ) : (
        <>
          {loading && <LoadingOverlay size="3" />}
          <Text size="6" weight="bold" mb="4" as="div">
            클럽회원 정보 수정
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
                        // readOnly
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
                      <Combobox
                        options={clubs
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                          .map((club) => ({ value: club._id || '', label: club.name }))}
                        value={form.club}
                        onValueChange={() => {}}
                        placeholder="클럽 선택"
                        disabled
                      />
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
                          <Select.Item value="대의원">대의원</Select.Item>
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
                        id="contact-input"
                        size="3"
                        placeholder="연락처"
                        value={form.contact}
                        onChange={(e) => handleChange('contact', e.target.value)}
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
                        id="birth-input"
                        size="3"
                        placeholder="출생년도"
                        value={form.birth}
                        onChange={(e) => handleChange('birth', e.target.value)}
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
                        id="tennisStartYear-input"
                        size="3"
                        placeholder="입문년도"
                        value={form.tennisStartYear}
                        onChange={(e) => handleChange('tennisStartYear', e.target.value)}
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
                        id="score-input"
                        size="3"
                        placeholder="점수"
                        value={form.score}
                        onChange={(e) => handleChange('score', e.target.value)}
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
              <Button type="submit" loading={loading} className="!flex-1" size="3">
                저장
              </Button>
              <Button
                variant="soft"
                color="gray"
                type="button"
                className="!flex-1"
                size="3"
                onClick={() => router.push(getReturnPath())}
              >
                취소
              </Button>
              <Button
                type="button"
                color="red"
                variant="soft"
                onClick={() => setDeleteDialogOpen(true)}
                className="!flex-1"
                size="3"
              >
                삭제
              </Button>
            </Flex>
          </form>
        </>
      )}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Title>정말 삭제하시겠습니까?</AlertDialog.Title>
          <AlertDialog.Description>
            이 작업은 되돌릴 수 없습니다. 해당 회원 정보를 영구히 삭제합니다.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" onClick={() => router.push(getReturnPath())}>
                취소
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={async () => {
                  await handleDelete();
                  router.push(getReturnPath());
                }}
                loading={loading}
              >
                삭제
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Container>
  );
}

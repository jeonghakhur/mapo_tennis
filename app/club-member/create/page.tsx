'use client';
import { Text, Button, TextField, Flex, Select, RadioGroup } from '@radix-ui/themes';
import Link from 'next/link';
import { useState } from 'react';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useClubs } from '@/hooks/useClubs';
import { createClubMemberRequest } from '@/hooks/useClubMembers';
import { useRouter } from 'next/navigation';
import Container from '@/components/Container';
import SkeletonCard from '@/components/SkeletonCard';

export default function ClubMemberCreatePage() {
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

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        const today = new Date().toISOString().slice(0, 10);
        await createClubMemberRequest({
          ...form,
          club: { _ref: form.club, _type: 'reference' },
          score: form.score ? Number(form.score) : undefined,
          joinedAt: today,
        });
        router.push('/club-member');
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
            <table className="table-form">
              <tbody>
                <tr>
                  <th>
                    <Text as="label" size="3" htmlFor="user-input">
                      이름
                    </Text>
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
                    <Text as="label" size="3" htmlFor="club-select">
                      클럽
                    </Text>
                  </th>
                  <td>
                    <Select.Root
                      size="3"
                      value={form.club}
                      onValueChange={(v) => handleChange('club', v)}
                      required
                    >
                      <Select.Trigger id="club-select" placeholder="클럽 선택" />
                      <Select.Content>
                        {clubs
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                          .map((club) => (
                            <Select.Item key={club._id} value={club._id || ''}>
                              {club.name}
                            </Select.Item>
                          ))}
                      </Select.Content>
                    </Select.Root>
                  </td>
                </tr>
                <tr>
                  <th>
                    <Text as="label" size="3" htmlFor="role-select">
                      직위
                    </Text>
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
                    <Text as="label" size="3" htmlFor="gender-male">
                      성별
                    </Text>
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
                    <Text as="label" size="3" htmlFor="contact-input">
                      연락처
                    </Text>
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
                    <Text as="label" size="3" htmlFor="birth-input">
                      출생년도
                    </Text>
                  </th>
                  <td>
                    <TextField.Root
                      id="birth-input"
                      size="3"
                      placeholder="출생년도(4자리)"
                      value={form.birth}
                      onChange={(e) => handleChange('birth', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>
                    <Text as="label" size="3" htmlFor="tennisStartYear-input">
                      입문년도
                    </Text>
                  </th>
                  <td>
                    <TextField.Root
                      id="tennisStartYear-input"
                      size="3"
                      placeholder="입문년도(4자리)"
                      value={form.tennisStartYear}
                      onChange={(e) => handleChange('tennisStartYear', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>
                    <Text as="label" size="3" htmlFor="email-input">
                      이메일
                    </Text>
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
                    <Text as="label" size="3" htmlFor="score-input">
                      점수
                    </Text>
                  </th>
                  <td>
                    <TextField.Root
                      id="score-input"
                      size="3"
                      placeholder="점수(숫자)"
                      value={form.score}
                      onChange={(e) => handleChange('score', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>
                    <Text as="label" size="3" htmlFor="status-active">
                      회원상태
                    </Text>
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

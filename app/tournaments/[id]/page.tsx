'use client';
import { Box, Text, Button, Flex, Badge } from '@radix-ui/themes';
import Container from '@/components/Container';
import { NotebookPen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useTournament, useDeleteTournament } from '@/hooks/useTournaments';
import { usePost } from '@/hooks/usePosts';
import { useUser } from '@/hooks/useUser';
import { useSession } from 'next-auth/react';
import { hasPermissionLevel, isAdmin } from '@/lib/authUtils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useState, useCallback, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import { mutate } from 'swr';
import { Tournament } from '@/model/tournament';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { wrapTextWithSpans } from '@/lib/utils';
import { getDivisionLabel } from '@/lib/tournamentUtils';

interface TournamentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { tournament, isLoading, error } = useTournament(id);
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const [contentLoaded, setContentLoaded] = useState(false);
  const { trigger: deleteTournament, isMutating: isDeleting } = useDeleteTournament(id);
  const { loading, withLoading } = useLoading();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { post: rulesPost, isLoading: isLoadingRules } = usePost(tournament?.rulesPostId || '');

  // 관리자 권한 확인
  const admin = isAdmin(user);

  // 모든 콘텐츠 로딩 상태 확인
  const isAllContentLoaded = useCallback(() => {
    if (isLoading) return false;
    if (!tournament) return false;
    // 규칙 포스트가 있는 경우 로딩 완료 확인
    if (tournament.rulesPostId && isLoadingRules) return false;

    return true;
  }, [isLoading, tournament, isLoadingRules]);

  // 콘텐츠 로딩 상태 업데이트
  useEffect(() => {
    if (isAllContentLoaded()) {
      setContentLoaded(true);
    }
  }, [isAllContentLoaded]);

  if (error) {
    return (
      <Container>
        <Box>
          <Text color="red">대회를 불러올 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  // 로딩이 완료되었고 에러가 없는데 대회가 없는 경우
  if (!isLoading && !error && !tournament) {
    return (
      <Container>
        <Box>
          <Text>대회를 찾을 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  if (!tournament) {
    return null;
  }

  const handleDelete = async () => {
    if (!tournament) return;

    try {
      await withLoading(() => deleteTournament());
      mutate(
        '/api/tournaments',
        (current: Tournament[] = []) => {
          return current.filter((t) => t._id !== id);
        },
        false,
      );
      router.push('/tournaments');
    } catch (error) {
      console.error('대회 삭제 실패:', error);
      alert('대회 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yy.MM.dd(eee)', { locale: ko });
  };

  // 참가 신청 기간 확인
  const isRegistrationPeriod = () => {
    if (!tournament.registrationStartDate || !tournament.registrationDeadline) {
      return false;
    }

    const now = new Date();
    const startDate = new Date(tournament.registrationStartDate);
    const endDate = new Date(tournament.registrationDeadline);

    // 시작일을 00:00:00 기준으로 설정
    startDate.setHours(0, 0, 0, 0);

    // 마감일을 23:59:59 기준으로 설정 (해당 날짜 마지막까지)
    endDate.setHours(23, 59, 59, 999);

    return now >= startDate && now <= endDate;
  };

  return (
    <Container>
      {isLoading || !contentLoaded ? (
        <SkeletonCard />
      ) : (
        <Box>
          {loading && <LoadingOverlay size="3" />}

          <div className="space-y-6">
            {/* 기본 정보 */}
            <Flex direction="column" gap="4">
              <Text weight="bold" className="block text-2xl">
                대회요강
              </Text>
              <div className="table-view">
                <table>
                  <tbody>
                    <tr>
                      <th style={{ width: '120px' }}>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('대회명칭')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.title}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('대회유형')}
                        </Flex>
                      </th>
                      <td className="!text-left">
                        {tournament.tournamentType === 'individual' ? '개인전' : '단체전'}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('주최')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.host || '-'}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('주관')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.organizer || '-'}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('대회기간')}
                        </Flex>
                      </th>
                      <td className="!text-left">
                        {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('개회식')}
                        </Flex>
                      </th>
                      <td className="!text-left">
                        {tournament.openingCeremony?.isHeld ? (
                          <div>
                            <div>
                              {tournament.openingCeremony.date &&
                                formatDate(tournament.openingCeremony.date)}{' '}
                              - {tournament.openingCeremony.time}
                            </div>

                            {tournament.openingCeremony.location && (
                              <div className="text-sm text-gray-600">
                                {tournament.openingCeremony.location}
                              </div>
                            )}
                          </div>
                        ) : (
                          '없음'
                        )}
                      </td>
                    </tr>

                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('대회장소')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.location}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('참가신청')}
                        </Flex>
                      </th>
                      <td className="!text-left">
                        {formatDate(tournament?.registrationStartDate || '')}
                        {tournament.registrationDeadline &&
                          `~ ${formatDate(tournament.registrationDeadline)}`}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('접수방법')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.registrationMethod || '-'}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('대진추첨')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.drawMethod || '-'}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('대회사용구')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.equipment || '-'}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('참가비')}
                        </Flex>
                      </th>
                      <td className="!text-left">
                        {`${tournament.entryFee?.toLocaleString()}원 ` || '-'}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('입금계좌')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.bankAccount}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('예금주')}
                        </Flex>
                      </th>
                      <td className="!text-left">{tournament.accountHolder}</td>
                    </tr>
                    <tr>
                      <th>
                        <Flex justify="between" align="center" flexGrow="1">
                          {wrapTextWithSpans('협회가입일')}
                        </Flex>
                      </th>
                      <td className="!text-left">
                        {tournament.clubJoinDate ? (
                          <>
                            {formatDate(tournament.clubJoinDate)}
                            <span className="text-red-600 ml-1">
                              이전 가입자만 참가 가능합니다.
                            </span>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {tournament.memo && (
                <div className="tiptab-content">
                  <MarkdownRenderer content={tournament.memo} />
                </div>
              )}

              {/* 참가부서 정보 */}
              {tournament.divisions && tournament.divisions.length > 0 && (
                <Flex direction="column" gap="4" style={{ width: '100%' }}>
                  <Text size="5" weight="bold" className="block">
                    참가부서 정보
                  </Text>
                  {tournament.divisions
                    .filter((division) => division.teamCount > 0)
                    .map((division, index) => (
                      <div key={division._key || index} className="table-view">
                        <Text weight="bold" size="4" mb="2" as="div">
                          {getDivisionLabel(division.division)}
                        </Text>
                        <table>
                          <tbody>
                            <tr>
                              <th style={{ width: '120px' }}>
                                <Flex justify="between" align="center" flexGrow="1">
                                  {wrapTextWithSpans('참가팀')}
                                </Flex>
                              </th>
                              <td className="!text-left">{division.teamCount}팀</td>
                            </tr>
                            <tr>
                              <th>
                                <Flex justify="between" align="center" flexGrow="1">
                                  {wrapTextWithSpans('경기일정')}
                                </Flex>
                              </th>
                              <td className="!text-left">
                                {division.matchDates.map((date, dateIndex) => (
                                  <Text key={dateIndex}>{formatDate(date)}</Text>
                                ))}
                              </td>
                            </tr>
                            <tr>
                              <th>
                                <Flex justify="between" align="center" flexGrow="1">
                                  {wrapTextWithSpans('시작시간')}
                                </Flex>
                              </th>
                              <td className="!text-left">{division.startTime}</td>
                            </tr>

                            <tr>
                              <th>
                                <Flex justify="between" align="center" flexGrow="1">
                                  {wrapTextWithSpans('시상')}
                                </Flex>
                              </th>
                              <td className="!text-left">
                                <Flex align="center" gap="2">
                                  <Badge color="yellow" variant="soft" size="3">
                                    1위
                                  </Badge>
                                  <Text>{division.prizes.first.toLocaleString()}원</Text>
                                </Flex>
                                <Flex align="center" gap="2" mt="2">
                                  <Badge color="gray" variant="soft" size="3">
                                    2위
                                  </Badge>
                                  <Text>{division.prizes.second.toLocaleString()}원</Text>
                                </Flex>
                                <Flex align="center" gap="2" mt="2">
                                  <Badge color="brown" variant="soft" size="3">
                                    3위
                                  </Badge>
                                  <Text>{division.prizes.third.toLocaleString()}원</Text>
                                </Flex>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                </Flex>
              )}
            </Flex>

            {/* 대회 규칙 포스트 내용 */}
            {tournament.rulesPostId && (
              <div className="pt-4 border-t">
                {rulesPost ? (
                  <MarkdownRenderer content={rulesPost.content} />
                ) : (
                  <Text>대회 규칙을 찾을 수 없습니다.</Text>
                )}
              </div>
            )}

            {admin && (
              <div className="btn-wrap border-t pt-4">
                <Button
                  variant={tournament.isDraft ? 'solid' : 'soft'}
                  color={tournament.isDraft ? 'green' : 'orange'}
                  disabled={isUpdatingStatus}
                  onClick={async () => {
                    if (isUpdatingStatus) return;

                    setIsUpdatingStatus(true);
                    try {
                      const response = await fetch(`/api/tournaments/${id}/publish`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          isDraft: !tournament.isDraft,
                        }),
                      });

                      if (response.ok) {
                        const updatedTournament = await response.json();

                        // SWR 캐시 업데이트 - 개별 대회 데이터
                        mutate(`/api/tournaments/${id}`, updatedTournament, false);

                        // SWR 캐시 업데이트 - 대회 목록 데이터
                        mutate(
                          '/api/tournaments',
                          (currentData: Tournament[] | undefined) => {
                            if (!currentData) return currentData;
                            return currentData.map((t) =>
                              t._id === id ? { ...t, isDraft: !tournament.isDraft } : t,
                            );
                          },
                          false,
                        );

                        // 성공 메시지
                        alert(tournament.isDraft ? '게시되었습니다.' : '임시저장되었습니다.');
                      } else {
                        alert(
                          tournament.isDraft ? '게시에 실패했습니다.' : '임시저장에 실패했습니다.',
                        );
                      }
                    } catch {
                      alert(
                        tournament.isDraft
                          ? '게시 중 오류가 발생했습니다.'
                          : '임시저장 중 오류가 발생했습니다.',
                      );
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                  size="3"
                >
                  {isUpdatingStatus ? '처리 중...' : tournament.isDraft ? '게시' : '임시저장'}
                </Button>
                <Button
                  variant="soft"
                  onClick={() => router.push(`/tournaments/${id}/edit`)}
                  size="3"
                  disabled={isDeleting}
                >
                  수정
                </Button>
                <ConfirmDialog
                  title="대회 삭제"
                  description={`"${tournament.title}" 대회를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                  confirmText="삭제"
                  cancelText="취소"
                  confirmColor="red"
                  onConfirm={handleDelete}
                  disabled={isDeleting}
                  trigger={
                    <Button variant="soft" color="red" size="3" disabled={isDeleting}>
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </Button>
                  }
                />

                <Button
                  variant="soft"
                  color="green"
                  onClick={() => router.push(`/tournaments/${id}/applications`)}
                  size="3"
                >
                  참가목록
                </Button>
              </div>
            )}
          </div>

          {/* 플로팅 참가 신청 버튼 */}
          {hasPermissionLevel(user, 1) &&
            (isAdmin(user) || (tournament.status === 'upcoming' && isRegistrationPeriod())) && (
              <div
                style={{
                  position: 'fixed',
                  top: '75px',
                  right: '20px',
                  zIndex: 1000,
                }}
              >
                <Button size="3" onClick={() => router.push(`/tournaments/${id}/apply`)}>
                  <NotebookPen size={16} /> 참가신청
                </Button>
              </div>
            )}
        </Box>
      )}
    </Container>
  );
}

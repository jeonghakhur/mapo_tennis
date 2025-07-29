'use client';
import Container from '@/components/Container';
import '@radix-ui/themes/styles.css';
import { getMainPosts } from '@/service/post';
import { getUpcomingTournaments } from '@/service/tournament';
import { useEffect, useState } from 'react';
import { Box, Text, Flex, Card, Badge, Button } from '@radix-ui/themes';
import type { Post } from '@/model/post';
import type { Tournament } from '@/model/tournament';
import dynamic from 'next/dynamic';
import { Calendar, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SkeletonCard from '@/components/SkeletonCard';
import { hasPermissionLevel } from '@/lib/authUtils';
import { useSession } from 'next-auth/react';

const MarkdownRenderer = dynamic(() => import('@/components/MarkdownRenderer'), { ssr: false });

export default function Page() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    (async () => {
      const [postResult, tournamentResult] = await Promise.all([
        getMainPosts(),
        getUpcomingTournaments(),
      ]);
      setPosts(postResult);
      setTournaments(tournamentResult);
      setLoading(false);
    })();
  }, []);

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'red' | 'blue' | 'green' | 'gray'> = {
      upcoming: 'blue',
      ongoing: 'green',
      completed: 'gray',
      cancelled: 'red',
    };
    return colorMap[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      upcoming: '예정',
      ongoing: '진행중',
      completed: '완료',
      cancelled: '취소',
    };
    return labelMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container>
      {loading ? (
        <SkeletonCard />
      ) : tournaments.length === 0 ? (
        <Text>예정된 대회가 없습니다.</Text>
      ) : (
        <div className="space-y-4" style={{ marginBottom: 32 }}>
          {tournaments.map((tournament) => (
            <Card key={tournament._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge color={getStatusColor(tournament.status)} size="2">
                    {getStatusLabel(tournament.status)}
                  </Badge>
                  <Text size="5" weight="bold" className="block mb-2">
                    {tournament.title}
                  </Text>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <Text>
                      {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
                    </Text>
                  </div>
                  <div className="space-y-2">
                    {tournament.registrationStartDate && (
                      <Text color="gray">
                        등록시작: {formatDate(tournament.registrationStartDate)}
                      </Text>
                    )}
                    {tournament.registrationDeadline && (
                      <Text color="gray">
                        등록마감: {formatDate(tournament.registrationDeadline)}
                      </Text>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <Text>{tournament.location}</Text>
                  </div>
                </div>
                <div className="btn-wrap">
                  {hasPermissionLevel(user, 1) && (
                    <Button
                      variant="solid"
                      color="blue"
                      size="3"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tournaments/${tournament._id}/apply`);
                      }}
                    >
                      참가 신청
                    </Button>
                  )}
                  <Button
                    variant="soft"
                    size="3"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/tournaments/${tournament._id}`);
                    }}
                  >
                    상세보기
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Flex direction="column" gap="4" mb="8">
        {posts.map((post) => (
          <Box key={post._id} p="4" style={{ border: '1px solid #eee', borderRadius: 8 }}>
            <Text size="4" weight="bold" as="div" mb="2">
              {post.title}
            </Text>

            <MarkdownRenderer content={post.content} />
          </Box>
        ))}
      </Flex>
    </Container>
  );
}

'use client';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useClubs } from '@/hooks/useClubs';
import Link from 'next/link';
import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/lib/client'; // sanity client
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import SkeletonCard from '@/components/SkeletonCard';
import { NotebookPen } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import { Combobox } from '@/components/ui/combobox';
import React from 'react';
import { isModerator } from '@/lib/authUtils';

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default function ClubPage() {
  const router = useRouter();
  const { clubs, isLoading, error } = useClubs();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);

  let myClubIds: string[] = [];
  if (user?.clubs && Array.isArray(user.clubs)) {
    myClubIds = user.clubs.map((c) => c._ref).filter(Boolean);
  }

  // 클럽명 필터 상태
  const [clubFilter, setClubFilter] = React.useState<string>('');

  const myClubs = clubs.filter((club) => myClubIds.includes(club._id!));
  const otherClubs = clubs.filter((club) => !myClubIds.includes(club._id!));

  // 클럽명 콤보박스 옵션
  const clubOptions = clubs.map((club) => ({ value: club._id!, label: club.name }));

  // 필터 적용된 클럽 목록
  const filteredMyClubs = clubFilter ? myClubs.filter((club) => club._id === clubFilter) : myClubs;
  const filteredOtherClubs = clubFilter
    ? otherClubs.filter((club) => club._id === clubFilter)
    : otherClubs;

  if (error) {
    return (
      <Container>
        <Box>
          <Text color="red">클럽 목록을 불러올 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  // 데이터 로딩 중에는 스켈레톤
  if (isLoading) {
    return (
      <Container>
        <SkeletonCard />
      </Container>
    );
  }

  // 실제 목록 렌더링
  return (
    <Container>
      <Flex mb="4" direction="column" gap="4">
        <Combobox
          options={[{ value: '', label: '전체 클럽' }, ...clubOptions]}
          value={clubFilter}
          onValueChange={setClubFilter}
          placeholder="클럽명 선택"
        />
      </Flex>
      {session?.user && myClubs.length > 0 && (
        <>
          <Text size="4" weight="bold" mb="2" as="div">
            내가 가입한 클럽
          </Text>
          {filteredMyClubs.map((club) => (
            <Link
              key={club._id}
              href={`/club/${club._id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Box
                mb="4"
                p="3"
                style={{
                  border: '1px solid #eee',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {club.image?.asset?._ref && (
                  <Image
                    src={urlFor(club.image!).width(200).height(200).url()}
                    alt={club.name}
                    width={24}
                    height={24}
                    style={{ borderRadius: 8, objectFit: 'cover' }}
                  />
                )}
                <div>
                  <Text size="4" weight="bold" as="div">
                    클럽명: {club.name}
                  </Text>
                  <Text size="3" color="gray">
                    운동장소: {club.location}
                  </Text>
                  <Text size="2">{club.description}</Text>
                </div>
              </Box>
            </Link>
          ))}
          <hr style={{ margin: '2rem 0' }} />
        </>
      )}
      {filteredOtherClubs.length === 0 && (!session?.user || filteredMyClubs.length === 0) ? (
        <Text size="3" color="gray" align="center">
          등록된 클럽이 없습니다.
        </Text>
      ) : (
        filteredOtherClubs.map((club) => (
          <Link
            key={club._id}
            href={`/club/${club._id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              mb="4"
              p="3"
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {club.image?.asset?._ref && (
                <Image
                  src={urlFor(club.image!).width(200).height(200).url()}
                  alt={club.name}
                  width={24}
                  height={24}
                  style={{ borderRadius: 8, objectFit: 'cover' }}
                />
              )}
              <div>
                <Text size="4" weight="bold" as="div">
                  클럽명: {club.name}
                </Text>
                <Text size="3" color="gray">
                  운동장소: {club.location}
                </Text>
                <Text size="2">{club.description}</Text>
              </div>
            </Box>
          </Link>
        ))
      )}

      {/* 플로팅 클럽 등록 버튼 */}
      {isModerator(user) && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
          }}
        >
          <Button
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => router.push('/club/create')}
          >
            <NotebookPen size={24} />
          </Button>
        </div>
      )}
    </Container>
  );
}

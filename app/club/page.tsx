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
import { isHydrating } from '@/lib/isHydrating';
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import { hasPermissionLevel } from '@/lib/authUtils';

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default function ClubPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser(session?.user?.email);
  const { clubs, isLoading, error } = useClubs();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // 이미지 로드 완료 처리
  const handleImageLoad = useCallback((clubId: string) => {
    setLoadedImages((prev) => new Set([...prev, clubId]));
  }, []);

  // 권한 체크 (레벨 4 이상)
  if (session && !hasPermissionLevel(user, 4)) {
    return (
      <Container>
        <Box>
          <Text color="red" size="4" weight="bold">
            접근 권한이 없습니다.
          </Text>
          <Text color="gray" size="3" style={{ marginTop: '8px' }}>
            클럽 페이지는 레벨 4 이상의 사용자만 접근할 수 있습니다.
          </Text>
        </Box>
      </Container>
    );
  }

  // 모든 이미지가 로드되었는지 확인
  const allImagesLoaded = clubs
    .filter((club) => club.image?.asset?._ref)
    .every((club) => club._id && loadedImages.has(club._id));

  if (error) {
    return (
      <Container>
        <Box>
          <Text color="red">클럽 목록을 불러올 수 없습니다.</Text>
        </Box>
      </Container>
    );
  }

  const hydrating = isHydrating(isLoading, clubs);

  return (
    <Container>
      {hydrating ? (
        <SkeletonCard />
      ) : (
        <Box>
          <Flex align="center" justify="between" mb="6">
            <Text size="6" weight="bold">
              테니스 클럽
            </Text>
            <Button onClick={() => router.push('/club/create')} size="3">
              클럽 등록
            </Button>
          </Flex>

          {/* 이미지 로딩 중이거나 데이터 로딩 중일 때 스켈레톤 표시 */}
          {isLoading || !allImagesLoaded ? (
            <SkeletonCard />
          ) : (
            <div>
              {clubs.length === 0 ? (
                <Text size="3" color="gray" align="center">
                  등록된 클럽이 없습니다.
                </Text>
              ) : (
                clubs.map((club) => (
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
                          onLoad={() => club._id && handleImageLoad(club._id)}
                          style={{ borderRadius: 8, objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <Text size="4" weight="bold">
                          {club.name}
                        </Text>
                        <Text size="2" color="gray">
                          {club.location}
                        </Text>
                        <Text size="2">{club.description}</Text>
                      </div>
                    </Box>
                  </Link>
                ))
              )}
            </div>
          )}
        </Box>
      )}
    </Container>
  );
}

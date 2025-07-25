'use client';
import { Box, Text, Button } from '@radix-ui/themes';
import Container from '@/components/Container';
import { useRouter } from 'next/navigation';
import { useClubs } from '@/hooks/useClubs';
import Link from 'next/link';
import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/lib/client'; // sanity client
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import SkeletonCard from '@/components/SkeletonCard';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/hooks/useUser';
import { hasPermissionLevel } from '@/lib/authUtils';
import { NotebookPen } from 'lucide-react';

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default function ClubPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user } = useUser(session?.user?.email);
  const { clubs, isLoading, error } = useClubs();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      setHasPermission(hasPermissionLevel(user, 4));
    } else {
      setHasPermission(null);
    }
  }, [user]);

  // handleImageLoad, loadedImages, allImagesLoaded 등 이미지 로딩 관련 코드 삭제

  // 세션 로딩 중에는 아무것도 렌더링하지 않음
  if (status === 'loading') {
    return null; // 또는 <SkeletonCard />
  }

  if (status === 'unauthenticated') {
    return (
      <Container>
        <Box>
          <Text color="red" size="4" weight="bold">
            로그인이 필요합니다.
          </Text>
        </Box>
      </Container>
    );
  }

  if (hasPermission === false) {
    return (
      <Container>
        <Box>
          <Text color="red" size="4" weight="bold">
            접근 권한이 없습니다.
          </Text>
        </Box>
      </Container>
    );
  }

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
                  style={{ borderRadius: 8, objectFit: 'cover' }}
                />
              )}
              <div>
                <Text size="4" weight="bold" as="div">
                  {club.name}
                </Text>
                <Text size="3" color="gray">
                  {club.location}
                </Text>
                <Text size="2">{club.description}</Text>
              </div>
            </Box>
          </Link>
        ))
      )}

      {/* 플로팅 클럽 등록 버튼 */}
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
    </Container>
  );
}

'use client';
import { Box, Text, Button } from '@radix-ui/themes';
import { useSession } from 'next-auth/react';
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

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default function ClubPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { clubs, isLoading, error } = useClubs();

  const hydrating = isHydrating(isLoading, clubs);

  return (
    <Container>
      {hydrating && <SkeletonCard lines={2} />}
      {session?.user && (
        <Box mb="4">
          <Button size="3" onClick={() => router.push('/club/create')}>
            클럽생성
          </Button>
        </Box>
      )}
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>클럽 목록</h2>
      {error && <Text color="red">클럽 목록을 불러오지 못했습니다.</Text>}
      <Box>
        {clubs.length === 0 && <Text>등록된 클럽이 없습니다.</Text>}
        {clubs
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
          .map((club) => (
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
                    src={urlFor(club.image).width(200).height(200).url()}
                    alt={club.name}
                    width={24}
                    height={24}
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
          ))}
      </Box>
    </Container>
  );
}

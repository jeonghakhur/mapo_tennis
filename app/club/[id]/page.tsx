'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Text, Button, Flex, AlertDialog } from '@radix-ui/themes';
import Container from '@/components/Container';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { useClub } from '@/hooks/useClubs';
import SkeletonCard from '@/components/SkeletonCard';
import { isHydrating } from '@/lib/isHydrating';

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { club, isLoading, deleteClubById } = useClub(id);
  const [open, setOpen] = useState(false); // AlertDialog open state
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClubById();
      router.push('/club');
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
    setDeleting(false);
    setOpen(false);
  };

  const hydrating = isHydrating(isLoading, club);

  return (
    <Container>
      {hydrating ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          <Button size="2" variant="soft" color="gray" mb="4" onClick={() => router.back()}>
            목록으로 돌아가기
          </Button>
          <Flex gap="3" mb="4">
            <Button size="2" color="blue" onClick={() => router.push(`/club/${id}/edit`)}>
              수정
            </Button>
            <AlertDialog.Root open={open} onOpenChange={setOpen}>
              <AlertDialog.Trigger>
                <Button size="2" color="red" variant="soft" disabled={deleting}>
                  삭제
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Title>클럽 삭제</AlertDialog.Title>
                <AlertDialog.Description>
                  정말로 이 클럽을 삭제하시겠습니까?
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">
                      취소
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button color="red" onClick={handleDelete} loading={deleting}>
                      삭제
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </Flex>
          {club && (
            <>
              {club.image?.asset?._ref && (
                <Box mb="4">
                  <Image
                    src={urlFor(club.image).url()}
                    alt={club.name}
                    width={800}
                    height={600}
                    style={{
                      borderRadius: 12,
                      objectFit: 'contain',
                      maxWidth: 320,
                      maxHeight: 200,
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                </Box>
              )}
              <Box mb="4">
                <Text size="6" weight="bold">
                  {club.name}
                </Text>
              </Box>
              <Box mb="2">
                <Text size="4">{club.description}</Text>
              </Box>
              <Box mb="2">
                <Text size="3" color="gray">
                  장소: {club.location}
                </Text>
              </Box>
              <Box mb="2">
                <Text size="3" color="gray">
                  공개여부: {club.isPublic ? '공개' : '비공개'}
                </Text>
              </Box>
              <Box mb="2">
                <Text size="3" color="gray">
                  연락처: {club.contact || '-'}
                </Text>
              </Box>
            </>
          )}
        </>
      )}
    </Container>
  );
}

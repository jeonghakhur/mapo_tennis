'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, AlertDialog, DataList } from '@radix-ui/themes';
import Container from '@/components/Container';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { useClub } from '@/hooks/useClubs';
import SkeletonCard from '@/components/SkeletonCard';
import { isHydrating } from '@/lib/isHydrating';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { club, isLoading, deleteClubById } = useClub(id);
  const [open, setOpen] = useState(false); // AlertDialog open state
  const [deleting, setDeleting] = useState(false);
  const { loading, withLoading } = useLoading();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      withLoading(() => deleteClubById());
      router.push('/club');
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
    setDeleting(false);
    // setOpen(false);
  };

  const hydrating = isHydrating(isLoading, club);

  return (
    <Container>
      {hydrating ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          {loading && <LoadingOverlay size="3" />}
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
              <DataList.Root>
                {club.image?.asset?._ref && (
                  <DataList.Item align="center">
                    <DataList.Label>클럽 이미지</DataList.Label>
                    <DataList.Value>
                      <Image
                        src={urlFor(club.image).url()}
                        alt={club.name}
                        width={160}
                        height={120}
                        style={{
                          borderRadius: 12,
                          objectFit: 'contain',
                          maxWidth: 160,
                          maxHeight: 120,
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                        }}
                      />
                    </DataList.Value>
                  </DataList.Item>
                )}
                <DataList.Item>
                  <DataList.Label>클럽명</DataList.Label>
                  <DataList.Value>{club.name}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label>소개</DataList.Label>
                  <DataList.Value>{club.description}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label>장소</DataList.Label>
                  <DataList.Value>{club.location}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label>공개여부</DataList.Label>
                  <DataList.Value>{club.isPublic ? '공개' : '비공개'}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label>연락처</DataList.Label>
                  <DataList.Value>{club.contact || '-'}</DataList.Value>
                </DataList.Item>
              </DataList.Root>
            </>
          )}
        </>
      )}
    </Container>
  );
}

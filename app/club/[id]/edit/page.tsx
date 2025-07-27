'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Button, TextField, Flex, Switch, Separator, Checkbox } from '@radix-ui/themes';
import Container from '@/components/Container';
import Image from 'next/image';
import { useClub } from '@/hooks/useClubs';
import { urlFor } from '@/sanity/lib/image';
import { useDropzone } from 'react-dropzone';
import { isHydrating } from '@/lib/isHydrating';
import SkeletonCard from '@/components/SkeletonCard';
import { useLoading } from '@/hooks/useLoading';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function ClubEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { club, updateClubById, isLoading } = useClub(id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workDays, setWorkDays] = useState('');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [contact, setContact] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isMangwonChecked, setIsMangwonChecked] = useState(false);
  const { loading, withLoading } = useLoading();

  useEffect(() => {
    if (club) {
      setName(club.name || '');
      setDescription(club.description || '');
      setWorkDays(club.workDays || '');
      setLocation(club.location || '');
      setIsPublic(club.isPublic ?? true);
      setContact(club.contact || '');
      if (club.image?.asset?._ref) {
        setPreview(urlFor(club.image).url());
      }
      setIsMangwonChecked(club.location === '망원나들목');
    }
  }, [club]);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setImage(acceptedFiles[0]);
      setPreview(URL.createObjectURL(acceptedFiles[0]));
      setImageRemoved(false);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleImageRemove = () => {
    setImage(null);
    setPreview(null);
    setImageRemoved(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      const updateData: Record<string, string | boolean | null | undefined> = {
        name,
        description,
        workDays,
        location,
        isPublic,
        contact,
      };
      if (imageRemoved) {
        updateData.image = null;
      }
      await withLoading(() => updateClubById(updateData, image ?? undefined));
      setSuccess('클럽이 성공적으로 수정되었습니다!');
      setTimeout(() => router.push(`/club/${id}`), 1000);
    } catch (e) {
      setError('서버 오류가 발생했습니다. ' + String(e));
    }
  };

  const hydrating = isHydrating(isLoading, club);

  return (
    <Container>
      {hydrating ? (
        <SkeletonCard />
      ) : (
        <>
          {loading && <LoadingOverlay size="3" />}
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>클럽 수정</h2>
          <form onSubmit={handleSubmit}>
            <Separator my="4" size="4" />
            <TextField.Root
              placeholder="클럽명"
              value={name}
              onChange={(e) => setName(e.target.value)}
              mb="3"
              size="3"
              required
            />
            <TextField.Root
              placeholder="소개글"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              mb="3"
              size="3"
              required
            />
            <TextField.Root
              placeholder="운동일 (예: 매주 토요일, 주 2회 등)"
              value={workDays}
              onChange={(e) => setWorkDays(e.target.value)}
              mb="3"
              size="3"
            />
            {/* 망원나들목 체크박스 UI */}
            <Flex align="center" gap="2" mb="2">
              <Checkbox
                size="3"
                checked={isMangwonChecked}
                onCheckedChange={(checked) => {
                  setIsMangwonChecked(!!checked);
                  if (checked) {
                    setLocation('망원나들목');
                  } else {
                    setLocation('');
                  }
                }}
                id="mangwon"
              />
              <label htmlFor="mangwon" style={{ cursor: 'pointer' }}>
                망원나들목
              </label>
            </Flex>
            <TextField.Root
              placeholder="운동장소 (예: 마포구민체육센터)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              mb="3"
              size="3"
              readOnly={isMangwonChecked}
            />
            <TextField.Root
              placeholder="연락처 (선택)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              mb="3"
              size="3"
            />
            <Flex align="center" gap="2" mb="3">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Text size="2">{isPublic ? '공개 클럽' : '비공개 클럽'}</Text>
            </Flex>
            {/* 이미지 미리보기/삭제 UI */}
            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <Image
                  src={preview}
                  alt="미리보기"
                  width={800}
                  height={600}
                  style={{ borderRadius: 8 }}
                />
                <button
                  type="button"
                  onClick={handleImageRemove}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: 16,
                    lineHeight: '24px',
                    textAlign: 'center',
                    padding: 0,
                  }}
                  aria-label="이미지 삭제"
                >
                  ×
                </button>
              </div>
            ) : !imageRemoved && club?.image?.asset?._ref ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <Image
                  src={urlFor(club.image).width(100).height(100).url()}
                  alt="기존 이미지"
                  width={100}
                  height={100}
                  style={{ borderRadius: 8 }}
                />
                <button
                  type="button"
                  onClick={handleImageRemove}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: 16,
                    lineHeight: '24px',
                    textAlign: 'center',
                    padding: 0,
                  }}
                  aria-label="이미지 삭제"
                >
                  ×
                </button>
              </div>
            ) : null}
            {/* 이미지 첨부 UI (이미지가 없을 때만) */}
            {!preview && (imageRemoved || !club?.image?.asset?._ref) && (
              <div
                {...getRootProps()}
                style={{
                  border: '2px dashed #aaa',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                  marginBottom: 16,
                  cursor: 'pointer',
                  background: isDragActive ? '#f0f0f0' : '#fafafa',
                }}
              >
                <input {...getInputProps()} />
                <Text size="2" color="gray">
                  {isDragActive
                    ? '여기로 이미지를 드래그하세요...'
                    : '클릭 또는 드래그로 대표 이미지를 첨부하세요'}
                </Text>
              </div>
            )}
            <Flex justify="end" gap="2" mt="4">
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                onClick={() => router.push(`/club/${id}`)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" size="3" disabled={isLoading}>
                {isLoading ? '수정 중...' : '수정하기'}
              </Button>
            </Flex>
            {error && (
              <Text color="red" mt="3" align="center">
                {error}
              </Text>
            )}
            {success && (
              <Text color="green" mt="3" align="center">
                {success}
              </Text>
            )}
          </form>
        </>
      )}
    </Container>
  );
}

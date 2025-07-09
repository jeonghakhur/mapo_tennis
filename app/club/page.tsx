'use client';
import { useState, useCallback } from 'react';
import { Card, Box, Text, Button, TextField, Flex, Switch, Separator } from '@radix-ui/themes';
import { useSession } from 'next-auth/react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

export default function ClubPage() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workDays, setWorkDays] = useState(''); // 운동일
  const [location, setLocation] = useState(''); // 운동장소
  const [isPublic, setIsPublic] = useState(true);
  const [contact, setContact] = useState('');
  const [image, setImage] = useState<File | null>(null); // 추후 이미지 업로드 구현 시 사용
  const [preview, setPreview] = useState<string | null>(null); // 추후 이미지 업로드 구현 시 사용
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // react-dropzone 사용
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setImage(acceptedFiles[0]);
      setPreview(URL.createObjectURL(acceptedFiles[0]));
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('workDays', workDays);
      formData.append('location', location);
      formData.append('isPublic', String(isPublic));
      formData.append('contact', contact);
      // members 등 추가 필요시 formData.append('members', JSON.stringify(members));
      if (image) {
        formData.append('image', image);
      }
      console.log('FormData 내용:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await fetch('/api/club/create', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSuccess('클럽이 성공적으로 생성되었습니다!');
        setShowForm(false);
      } else {
        setError(data.error || '클럽 생성에 실패했습니다.');
      }
    } catch (e) {
      setError('서버 오류가 발생했습니다. ' + String(e));
    }
    setIsLoading(false);
  };

  return (
    <Box>
      <Card style={{ width: 400, padding: 32, background: '#fff', margin: '0 auto' }}>
        <Text size="5" weight="bold" align="center" mb="4">
          클럽
        </Text>
        <Text size="3" align="center" color="gray" mb="4">
          클럽 관련 기능이 이곳에 추가될 예정입니다.
        </Text>
        {session?.user && !showForm && (
          <Box mb="4">
            <Button size="3" onClick={() => setShowForm((v) => !v)}>
              클럽생성
            </Button>
          </Box>
        )}
        {showForm && (
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
            <TextField.Root
              placeholder="운동장소 (예: 마포구민체육센터)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              mb="3"
              size="3"
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
            {/* 파일 첨부 UI (react-dropzone) */}
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
              {preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Image
                    src={preview}
                    alt="미리보기"
                    width={100}
                    height={100}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 120,
                      margin: '0 auto 8px',
                      borderRadius: 8,
                      display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // dropzone 클릭 방지
                      setImage(null);
                      setPreview(null);
                    }}
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
              ) : (
                <Text size="2" color="gray">
                  {isDragActive
                    ? '여기로 이미지를 드래그하세요...'
                    : '클릭 또는 드래그로 대표 이미지를 첨부하세요'}
                </Text>
              )}
            </div>
            <Flex justify="end" gap="2" mt="4">
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                onClick={() => setShowForm(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" size="3" disabled={isLoading}>
                {isLoading ? '생성 중...' : '생성하기'}
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
        )}
      </Card>
    </Box>
  );
}

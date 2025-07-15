'use client';
import { useRef, useEffect, useState } from 'react';
import { Box, Text } from '@radix-ui/themes';
import { uploadImageToSanityAssets } from '@/lib/sanityAssets';
import dynamic from 'next/dynamic';

// Toast UI Editor를 동적으로 import
const Editor = dynamic(
  () => import('@toast-ui/react-editor').then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded"></div>,
  },
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<{ getInstance: () => { getMarkdown: () => string } }>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // CSS를 동적으로 로드
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://uicdn.toast.com/editor/latest/toastui-editor.css';
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      // Sanity Assets로 이미지 업로드
      const asset = await uploadImageToSanityAssets(file);
      return asset.url;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
      return '';
    }
  };

  const handleChange = () => {
    if (editorRef.current) {
      const markdown = editorRef.current.getInstance().getMarkdown();
      onChange(markdown);
    }
  };

  return (
    <Box>
      <div className="flex items-center justify-between mb-2">
        <Text size="2" weight="bold">
          내용 *
        </Text>
      </div>

      {isClient && (
        <Editor
          ref={editorRef}
          initialValue={value || ' '} // 여기서 value를 사용
          onChange={handleChange}
          height="400px"
          initialEditType="wysiwyg"
          useCommandShortcut={true}
          placeholder="포스트 내용을 작성하세요..."
          hooks={{
            addImageBlobHook: async (blob: File, callback: (url: string) => void) => {
              try {
                const url = await handleImageUpload(blob);
                if (url) {
                  callback(url);
                }
              } catch (error) {
                console.error('이미지 업로드 실패:', error);
              }
            },
          }}
        />
      )}
    </Box>
  );
}

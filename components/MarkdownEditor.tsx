'use client';
import { useRef, useEffect, useState } from 'react';
import { Box } from '@radix-ui/themes';
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
  const editorRef = useRef<{
    getInstance: () => { getMarkdown: () => string; setMarkdown: (markdown: string) => void };
  }>(null);
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // CSS를 동적으로 로드 (중복 방지)
    const existingLink = document.querySelector(
      'link[href="https://uicdn.toast.com/editor/latest/toastui-editor.css"]',
    );
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://uicdn.toast.com/editor/latest/toastui-editor.css';
      document.head.appendChild(link);
    }
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
      {isClient && (
        <div className="markdown-editor-container">
          <Editor
            ref={editorRef}
            initialValue={value || ' '} // 여기서 value를 사용
            onChange={handleChange}
            height="500px"
            initialEditType="markdown"
            previewStyle="vertical"
            useCommandShortcut={true}
            placeholder="포스트 내용을 작성하세요..."
            hooks={{
              addImageBlobHook: async (blob: File, callback: (url: string) => void) => {
                setIsUploading(true);
                try {
                  const uploadedUrl = await handleImageUpload(blob);
                  if (uploadedUrl) {
                    callback(uploadedUrl);
                  }
                } catch (error: unknown) {
                  console.error('이미지 업로드 실패:', error);
                  alert('이미지 업로드 중 오류가 발생했습니다.');
                } finally {
                  setIsUploading(false);
                }
              },
            }}
          />
          {isUploading && (
            <div className="markdown-editor-upload-overlay">
              <div className="spinner" />
              <div style={{ marginTop: 8 }}>이미지 업로드 중...</div>
            </div>
          )}
          <style jsx>{`
            .markdown-editor-container {
              font-size: 16px; /* 모바일에서 자동 확대 방지 */
            }
            .markdown-editor-container :global(.toastui-editor-defaultUI) {
              font-size: 16px;
            }
            .markdown-editor-container :global(.toastui-editor-defaultUI-toolbar) {
              font-size: 16px;
            }
            .markdown-editor-container :global(.toastui-editor-contents) {
              font-size: 16px;
            }
            .markdown-editor-upload-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(255, 255, 255, 0.7);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              z-index: 10;
            }
            .spinner {
              width: 40px;
              height: 40px;
              border: 4px solid #ccc;
              border-top: 4px solid #333;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}
    </Box>
  );
}

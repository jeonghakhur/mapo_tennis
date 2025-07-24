'use client';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Box } from '@radix-ui/themes';

// Toast UI Editor Viewer를 동적으로 import
const Viewer = dynamic(
  () => import('@toast-ui/react-editor').then((mod) => ({ default: mod.Viewer })),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded"></div>,
  },
);

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [isClient, setIsClient] = useState(false);
  const viewerRef = useRef<{ getInstance: () => { setMarkdown: (content: string) => void } }>(null);

  useEffect(() => {
    setIsClient(true);

    // CSS를 동적으로 로드
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://uicdn.toast.com/editor/latest/toastui-editor-viewer.css';
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // content가 변경될 때 Viewer 업데이트
  useEffect(() => {
    if (isClient && viewerRef.current && content) {
      const viewer = viewerRef.current.getInstance();
      if (viewer) {
        viewer.setMarkdown(content);
      }
    }
  }, [content, isClient]);

  // 디버깅을 위한 콘솔 로그

  return (
    <Box className="markdown-content" style={{ fontSize: '2rem' }}>
      {isClient && <Viewer ref={viewerRef} initialValue={content || ''} />}
    </Box>
  );
}

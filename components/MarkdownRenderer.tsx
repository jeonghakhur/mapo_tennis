'use client';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Box } from '@radix-ui/themes';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

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
  onImageClick?: (idx: number) => void;
}

// Sanity 이미지 URL인지 확인
function isSanityImageUrl(url: string): boolean {
  return url.includes('cdn.sanity.io') && url.includes('/assets/');
}

// Sanity 이미지 URL을 최적화된 URL로 변환
function optimizeSanityImageUrl(url: string): string {
  if (isSanityImageUrl(url)) {
    // Sanity 이미지 최적화 옵션 적용
    return url + '?w=1000&h=400&fit=crop&auto=format';
  }
  return url;
}

// 이미지 마크다운 추출
function extractImageMarkdowns(markdown: string): string[] {
  const regex = /!\[.*?\]\(.*?\)/g;
  return markdown.match(regex) || [];
}
// 이미지 마크다운 제거
function removeImageMarkdowns(markdown: string): string {
  return markdown.replace(/!\[.*?\]\(.*?\)/g, '');
}

export default function MarkdownRenderer({ content, onImageClick }: MarkdownRendererProps) {
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

  const imageMarkdowns = extractImageMarkdowns(content);
  const imageUrls = imageMarkdowns.map((md) => {
    const match = /!\[.*?\]\((.*?)\)/.exec(md);
    return match ? match[1] : '';
  });
  const textContent = removeImageMarkdowns(content);

  // 디버깅을 위한 콘솔 로그

  return (
    <Box className="markdown-content -mx-5">
      {imageUrls.length >= 1 && (
        <Swiper
          autoHeight={true}
          spaceBetween={10}
          slidesPerView={1}
          style={{ maxWidth: 600 }}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Pagination, Navigation]}
        >
          {imageUrls.map((url, idx) => (
            <SwiperSlide key={idx}>
              <Image
                src={optimizeSanityImageUrl(url)}
                alt={`image-${idx}`}
                width={1000}
                height={400}
                style={{
                  width: '100%',
                  // maxHeight: 400,
                  objectFit: 'contain',
                  cursor: onImageClick ? 'pointer' : undefined,
                }}
                onClick={onImageClick ? () => onImageClick(idx) : undefined}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      {isClient && (
        <Box px="5">
          <Viewer ref={viewerRef} initialValue={textContent || ''} />
        </Box>
      )}
    </Box>
  );
}

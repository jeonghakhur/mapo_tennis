import { useState, useEffect } from 'react';

interface UseImageLoaderProps {
  imageUrls: string[];
  onAllImagesLoaded?: () => void;
}

export function useImageLoader({ imageUrls, onAllImagesLoaded }: UseImageLoaderProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    const loadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, url]));
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${url}`);
          setLoadedImages((prev) => new Set([...prev, url])); // 에러가 나도 로드된 것으로 처리
          resolve();
        };
        img.src = url;
      });
    };

    const loadAllImages = async () => {
      try {
        await Promise.all(imageUrls.map(loadImage));
        setIsLoading(false);
        onAllImagesLoaded?.();
      } catch (error) {
        console.error('이미지 로딩 중 오류:', error);
        setIsLoading(false);
      }
    };

    loadAllImages();
  }, [imageUrls, onAllImagesLoaded]);

  const allImagesLoaded = loadedImages.size === imageUrls.length;

  return {
    isLoading,
    allImagesLoaded,
    loadedCount: loadedImages.size,
    totalCount: imageUrls.length,
  };
}

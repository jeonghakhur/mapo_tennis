'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useScrollRestoration(key: string) {
  const pathname = usePathname();
  const scrollKey = `${key}-scroll-position`;

  // 스크롤 복원
  useEffect(() => {
    const saved = sessionStorage.getItem(scrollKey);

    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10));
      });
      sessionStorage.removeItem(scrollKey);
    }
  }, [pathname, scrollKey]);

  // 스크롤 저장 (언로드 or 경로 변경 전)
  // 스크롤 저장 (scroll 이벤트 기준)
  useEffect(() => {
    const saveScroll = () => {
      const y = window.scrollY;
      sessionStorage.setItem(scrollKey, y.toString());
    };

    window.addEventListener('scroll', saveScroll);

    return () => {
      window.removeEventListener('scroll', saveScroll);
    };
  }, [scrollKey]);
}

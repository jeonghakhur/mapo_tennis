'use client';
import { useEffect } from 'react';

export default function PWAInstaller() {
  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // PWA 설치 프롬프트 처리
    window.addEventListener('beforeinstallprompt', (e) => {
      // 기본 설치 프롬프트 방지
      e.preventDefault();

      // 설치 버튼 표시 로직을 여기에 추가할 수 있습니다
      console.log('PWA 설치 가능');
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA가 성공적으로 설치되었습니다');
    });
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다
}

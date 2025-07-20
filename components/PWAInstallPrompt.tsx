'use client';
import { useState, useEffect } from 'react';
import { Button, Box, Text, Flex } from '@radix-ui/themes';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // PWA 설치 조건 확인
    const checkPWACriteria = () => {
      console.log('PWA 설치 조건 확인:');
      console.log('- HTTPS:', window.location.protocol === 'https:');
      console.log('- Service Worker:', 'serviceWorker' in navigator);
      console.log('- Manifest:', !!document.querySelector('link[rel="manifest"]'));
      console.log('- Standalone:', window.matchMedia('(display-mode: standalone)').matches);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt 이벤트 발생');
      // 기본 설치 프롬프트 방지
      e.preventDefault();
      // 나중에 사용하기 위해 이벤트 저장
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA가 성공적으로 설치되었습니다');
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    };

    // 초기 확인
    checkPWACriteria();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 설치 프롬프트 표시
    deferredPrompt.prompt();

    // 사용자 응답 대기
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('사용자가 PWA 설치를 수락했습니다');
    } else {
      console.log('사용자가 PWA 설치를 거부했습니다');
    }

    // 프롬프트 정리
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '90%',
      }}
    >
      <Flex justify="between" align="center" mb="3">
        <Text size="3" weight="bold">
          앱 설치
        </Text>
        <Button variant="ghost" size="1" onClick={handleDismiss} style={{ padding: '4px' }}>
          <X size={16} />
        </Button>
      </Flex>

      <Text size="2" color="gray" mb="3">
        홈화면에 추가하여 더 빠르게 접근하세요
      </Text>

      <Flex gap="2">
        <Button size="2" onClick={handleInstallClick} style={{ flex: 1 }}>
          <Download size={16} />
          설치
        </Button>
        <Button variant="soft" size="2" onClick={handleDismiss}>
          나중에
        </Button>
      </Flex>
    </Box>
  );
}

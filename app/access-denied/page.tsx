'use client';
import Container from '@/components/Container';
import { Button } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <Container>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle size={64} className="text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          해당 페이지에 접근할 권한이 없습니다. 관리자에게 문의하시거나 다른 페이지로 이동해주세요.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/')} size="3">
            홈으로 이동
          </Button>
          <Button variant="outline" onClick={() => router.back()} size="3">
            이전 페이지로
          </Button>
        </div>
      </div>
    </Container>
  );
}

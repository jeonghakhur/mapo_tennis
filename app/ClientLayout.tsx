'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup' && pathname !== '/welcome') {
      setShouldRender(false);
      router.replace('/welcome');
    } else {
      setShouldRender(true);
    }
  }, [searchParams, pathname, router]);

  return <>{shouldRender ? children : null}</>;
}

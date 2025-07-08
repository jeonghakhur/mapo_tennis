'use client';
import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

export default function SWRConfigContext({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher: (url: string) => fetch(url).then((res) => res.json()) }}>
      {children}
    </SWRConfig>
  );
}

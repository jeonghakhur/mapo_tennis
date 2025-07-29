import React from 'react';
import { Spinner } from '@radix-ui/themes';

export default function LoadingOverlay({ size = '3' }: { size?: '1' | '2' | '3' }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.25)',
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spinner size={size} style={{ color: 'red', transform: 'scale(2)' }} />
    </div>
  );
}

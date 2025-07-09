import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

type SkeletonProps = {
  lines?: number; // 각 카드 내 라인 수
  className?: string;
  lineClassName?: string;
  cardHeight?: number; // 각 카드의 높이(px)
};

export default function SkeletonCard({
  lines = 3,
  className = '',
  lineClassName = '',
  cardHeight = 120, // 기본 카드 높이(px)
}: SkeletonProps) {
  // SSR에서는 6, CSR에서만 실제 높이로 변경
  const [cardCount, setCardCount] = useState(6);

  useEffect(() => {
    const navbarHeight = 54;
    const bodyPaddingY = 40;
    const cardGap = 16;
    const height = window.innerHeight - navbarHeight - bodyPaddingY;
    const count = Math.floor(height / (cardHeight + cardGap));
    console.log(height, cardHeight, cardGap, count);

    setCardCount(count > 0 ? count : 1);
  }, [cardHeight]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-6">
        {Array.from({ length: cardCount }).map((_, idx) => (
          <div
            key={idx}
            className={clsx('bg-white rounded-lg shadow-md p-6 animate-pulse', lineClassName)}
            style={{ minHeight: cardHeight }}
          >
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: lines }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'h-4 bg-gray-200 rounded',
                    i === 1 ? 'w-2/3' : i === 2 ? 'w-1/2' : 'w-full',
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 텍스트를 각 글자마다 span 태그로 감싸는 함수
 * @param text 감쌀 텍스트
 * @param className span 태그에 적용할 CSS 클래스 (선택사항)
 * @returns 각 글자가 span으로 감싸진 JSX 요소
 */
export function wrapTextWithSpans(text: string, className?: string) {
  const chars = text.split('');
  return React.createElement(
    React.Fragment,
    null,
    chars.map((char, index) => React.createElement('span', { key: index, className }, char)),
  );
}

/**
 * 텍스트를 각 글자마다 span 태그로 감싸는 함수 (HTML 문자열 반환)
 * @param text 감쌀 텍스트
 * @param className span 태그에 적용할 CSS 클래스 (선택사항)
 * @returns 각 글자가 span으로 감싸진 HTML 문자열
 */
export function wrapTextWithSpansHTML(text: string, className?: string): string {
  return text
    .split('')
    .map((char) => `<span${className ? ` class="${className}"` : ''}>${char}</span>`)
    .join('');
}

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = 'https://mapo-tennis.com';
  const isProd = process.env.VERCEL_ENV === 'production';
  return {
    rules: isProd ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' }, // 프리뷰/개발 막기
    sitemap: isProd ? `${site}/sitemap.xml` : undefined,
  };
}

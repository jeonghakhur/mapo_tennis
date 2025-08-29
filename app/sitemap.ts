import type { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = 'https://mapo-tennis.vercel.app';
  const baseDate = new Date();

  // 정적 경로들 (NavBar.tsx의 NAV_ITEMS 기반) - 관리자 페이지 제외
  const staticRoutes = [
    '', // 홈페이지
    '/club',
    '/club-member',
    '/tournaments',
    '/awards',
    '/tournament-applications',
    '/questions',
    '/expenses',
    '/notifications',
    '/profile',
    '/auth/signin',
    '/auth/signup',
    '/welcome',
    '/about',
  ].map((path) => ({
    url: `${site}${path}`,
    lastModified: baseDate,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1.0 : 0.8,
  }));

  // 동적 경로들을 위한 배열
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // 1. 클럽 목록
    const clubs = await client.fetch(`
      *[_type == "club"] {
        _id,
        name,
        updatedAt
      }
    `);

    clubs.forEach((club: { _id: string; name: string; updatedAt?: string }) => {
      dynamicRoutes.push({
        url: `${site}/club/${club._id}`,
        lastModified: new Date(club.updatedAt || baseDate),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      });
    });

    // 2. 대회 목록
    const tournaments = await client.fetch(`
      *[_type == "tournament"] {
        _id,
        title,
        updatedAt
      }
    `);

    tournaments.forEach((tournament: { _id: string; title: string; updatedAt?: string }) => {
      dynamicRoutes.push({
        url: `${site}/tournaments/${tournament._id}`,
        lastModified: new Date(tournament.updatedAt || baseDate),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      });

      // 대회별 참가신청 페이지
      dynamicRoutes.push({
        url: `${site}/tournaments/${tournament._id}/apply`,
        lastModified: new Date(tournament.updatedAt || baseDate),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });

      // 대회별 신청목록 페이지
      dynamicRoutes.push({
        url: `${site}/tournaments/${tournament._id}/applications`,
        lastModified: new Date(tournament.updatedAt || baseDate),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      });
    });

    // 3. 대회결과 목록
    const awards = await client.fetch(`
      *[_type == "award"] {
        _id,
        title,
        updatedAt
      }
    `);

    awards.forEach((award: { _id: string; title: string; updatedAt?: string }) => {
      dynamicRoutes.push({
        url: `${site}/awards/${award._id}`,
        lastModified: new Date(award.updatedAt || baseDate),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      });
    });

    // 4. 조편성 관련 동적 경로들
    const groupings = await client.fetch(`
      *[_type == "tournamentGroup"] {
        tournamentId,
        division,
        updatedAt
      }
    `);

    groupings.forEach(
      (grouping: { tournamentId: string; division: string; updatedAt?: string }) => {
        // 조편성 결과 페이지
        dynamicRoutes.push({
          url: `${site}/tournament-grouping/results?tournamentId=${grouping.tournamentId}&division=${grouping.division}`,
          lastModified: new Date(grouping.updatedAt || baseDate),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        });

        // 예선 경기 페이지
        dynamicRoutes.push({
          url: `${site}/tournament-grouping/matches?tournamentId=${grouping.tournamentId}&division=${grouping.division}`,
          lastModified: new Date(grouping.updatedAt || baseDate),
          changeFrequency: 'daily' as const,
          priority: 0.9,
        });

        // 본선 대진표 페이지
        dynamicRoutes.push({
          url: `${site}/tournament-grouping/bracket/view?tournamentId=${grouping.tournamentId}&division=${grouping.division}`,
          lastModified: new Date(grouping.updatedAt || baseDate),
          changeFrequency: 'daily' as const,
          priority: 0.9,
        });
      },
    );

    // 5. 포스트 목록 (홈페이지에서 표시되는 콘텐츠)
    const posts = await client.fetch(`
      *[_type == "post"] {
        _id,
        title,
        updatedAt
      }
    `);

    posts.forEach((post: { _id: string; title: string; updatedAt?: string }) => {
      dynamicRoutes.push({
        url: `${site}/posts/${post._id}`,
        lastModified: new Date(post.updatedAt || baseDate),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      });
    });
  } catch (error) {
    console.error('동적 사이트맵 생성 중 오류:', error);
    // 오류 발생 시 정적 경로만 반환
  }

  return [...staticRoutes, ...dynamicRoutes];
}

import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function GET(req: NextRequest) {
  try {
    // 모든 조 문서를 가져와 (tournamentId, division)로 집계
    const groups: Array<{ tournamentId: string; division: string; _updatedAt?: string }> =
      await client.fetch(`*[_type == "tournamentGroup"]{ tournamentId, division, _updatedAt }`);

    if (!groups || groups.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // 유니크 키 생성 및 최신 업데이트 시간 집계
    const map = new Map<
      string,
      { tournamentId: string; division: string; count: number; updatedAt: string }
    >();
    for (const g of groups) {
      const key = `${g.tournamentId}__${g.division}`;
      const prev = map.get(key);
      const updatedAt = g._updatedAt || new Date(0).toISOString();
      if (prev) {
        prev.count += 1;
        if (updatedAt > prev.updatedAt) prev.updatedAt = updatedAt;
      } else {
        map.set(key, {
          tournamentId: g.tournamentId,
          division: g.division,
          count: 1,
          updatedAt,
        });
      }
    }

    const items = Array.from(map.values());

    const tournamentIds = Array.from(new Set(items.map((i) => i.tournamentId)));

    // 대회 타이틀 조회
    const tournaments: Array<{ _id: string; title: string }> = await client.fetch(
      `*[_type == "tournament" && _id in $ids]{ _id, title }`,
      { ids: tournamentIds },
    );

    const idToTitle = new Map(tournaments.map((t) => [t._id, t.title] as const));

    const enriched = items.map((i) => ({
      ...i,
      tournamentTitle: idToTitle.get(i.tournamentId) || '(제목 없음)',
    }));

    console.log({ groupings: enriched });
    return NextResponse.json({ groupings: enriched });
  } catch (e) {
    console.error('List grouping index error', e);
    return NextResponse.json({ error: 'Failed to load grouping index' }, { status: 500 });
  }
}

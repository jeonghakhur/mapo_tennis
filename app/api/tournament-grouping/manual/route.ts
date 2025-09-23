import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';
import type { Group } from '@/types/tournament';

// 수동 조편성 생성 핸들러
async function createManualGroupingHandler(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(body);
    return;
    const { tournamentId, division, groups } = body;

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    if (!groups || !Array.isArray(groups)) {
      return NextResponse.json({ error: '조 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    // 조별 팀 수 분배 계산
    const totalGroups = groups.length;
    const groupsWith3Teams = groups.filter((group) => group.teams.length === 3).length;
    const groupsWith2Teams = groups.filter((group) => group.teams.length === 2).length;

    // Sanity에 조 정보 저장
    const groupDocs = groups.map((group: Group) => ({
      _type: 'tournamentGroup',
      tournamentId,
      division,
      groupId: group.groupId,
      name: group.name,
      teams: group.teams.map((team, index) => ({
        _key: team._id || `team-${index}-${Date.now()}`,
        name: team.name,
        seed: team.seed,
        members: team.members,
        createdAt: team.createdAt,
      })),
      createdAt: new Date().toISOString(),
      createdBy: 'manual', // 수동 생성
    }));

    // 기존 조 정보 삭제 후 새로 생성
    await client.delete({
      query: `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division]`,
      params: { tournamentId, division },
    });

    // 새 조 정보 생성
    await Promise.all(groupDocs.map((doc) => client.create(doc)));

    const result = {
      groups,
      totalGroups,
      teamsPerGroup: 3, // 기본값
      remainingTeams: 0,
      distribution: {
        groupsWith3Teams,
        groupsWith2Teams,
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('수동 조편성 생성 오류:', error);
    return NextResponse.json(
      { error: '수동 조편성 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// POST: 수동 조편성 생성
export async function POST(req: NextRequest) {
  return withPermission(req, 5, createManualGroupingHandler);
}

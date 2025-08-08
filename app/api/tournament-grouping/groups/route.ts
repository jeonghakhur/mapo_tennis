import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// 조편성 결과 조회 핸들러
async function getGroupsHandler(req: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division');

    if (!tournamentId || !division) {
      return NextResponse.json({ error: '대회 ID와 부서는 필수입니다.' }, { status: 400 });
    }

    // 대회 정보 조회
    const tournamentQuery = `*[_type == "tournament" && _id == $tournamentId][0] {
      _id,
      tournamentType
    }`;

    const tournament = await client.fetch(tournamentQuery, { tournamentId });
    const isIndividual = tournament?.tournamentType === 'individual';

    // 조 정보 조회
    const query = `*[_type == "tournamentGroup" && tournamentId == $tournamentId && division == $division] {
      _id,
      groupId,
      name,
      teams,
      division
    } | order(name asc)`;

    const groups = await client.fetch(query, { tournamentId, division });

    // 팀 이름을 대회 타입에 따라 처리
    const processedGroups = groups.map((group: any) => ({
      ...group,
      teams: group.teams.map((team: any) => {
        if (isIndividual) {
          // 개인전: 이름 뒤에 클럽명
          const memberNames =
            team.members
              ?.map((member: any) => `${member.name} (${member.clubName || '클럽명 없음'})`)
              .join(', ') || '팀원 없음';
          return { ...team, name: memberNames };
        } else {
          // 단체전: 클럽명을 앞에 한 번만
          if (team.members && team.members.length > 0) {
            const clubName = team.members[0].clubName || '클럽명 없음';
            const memberNames = team.members.map((member: any) => member.name).join(', ');
            return { ...team, name: `${clubName} - ${memberNames}` };
          } else {
            return { ...team, name: '팀원 없음' };
          }
        }
      }),
    }));

    if (processedGroups.length === 0) {
      return NextResponse.json({ error: '조편성 결과가 없습니다.' }, { status: 404 });
    }

    // 조편성 결과 형태로 변환
    const totalGroups = processedGroups.length;
    const teamsPerGroup = Math.max(...processedGroups.map((g: any) => g.teams.length));
    const groupsWith3Teams = processedGroups.filter((g: any) => g.teams.length === 3).length;
    const groupsWith2Teams = processedGroups.filter((g: any) => g.teams.length === 2).length;

    const result = {
      groups: processedGroups,
      totalGroups,
      teamsPerGroup,
      remainingTeams: 0,
      distribution: {
        groupsWith3Teams,
        groupsWith2Teams,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('조편성 결과 조회 오류:', error);
    return NextResponse.json(
      { error: '조편성 결과 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// GET: 조편성 결과 조회
export async function GET(req: NextRequest) {
  return withPermission(req, 1, getGroupsHandler);
}

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/apiUtils';
import { client } from '@/sanity/lib/client';

// 관리자 권한으로 전체 회원 목록 조회
async function getUsersHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 검색 조건 구성
    let query = `*[_type == "user"`;
    if (search) {
      // 이름, 클럽명, 점수로 검색
      query += ` && (
        name match "*${search}*" || 
        email match "*${search}*" || 
        phone match "*${search}*" ||
        score == ${parseInt(search) || 0} ||
        clubs[]->name match "*${search}*"
      )`;
    }
    query += `]`;

    // 정렬 조건
    const sortField = sortBy === 'createdAt' ? '_createdAt' : sortBy;
    query += ` | order(${sortField} ${sortOrder})`;

    // 페이지네이션
    const start = (page - 1) * limit;
    const end = start + limit;
    query += ` [${start}...${end}]`;

    // 클럽 정보도 함께 가져오기 (clubMember의 approvedByAdmin 포함)
    query += ` {
      _id,
      _createdAt,
      name,
      email,
      phone,
      gender,
      birth,
      score,
      level,
      address,
      isApprovedUser,
      clubs[]->{
        _id,
        name,
        // clubMember의 approvedByAdmin 포함
        "approvedByAdmin": *[_type == 'clubMember' && user == ^.^.name && club._ref == ^._id][0].approvedByAdmin
      }
    }`;

    // 전체 개수 조회
    let countQuery = `count(*[_type == "user"`;
    if (search) {
      // 이름, 클럽명, 점수로 검색
      countQuery += ` && (
        name match "*${search}*" || 
        email match "*${search}*" || 
        phone match "*${search}*" ||
        score == ${parseInt(search) || 0} ||
        clubs[]->name match "*${search}*"
      )`;
    }
    countQuery += `])`;

    const [users, totalCount] = await Promise.all([client.fetch(query), client.fetch(countQuery)]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    return NextResponse.json({ error: '회원 목록 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // 관리자 권한 확인 (level 5 이상)
  return withPermission(req, 5, getUsersHandler);
}

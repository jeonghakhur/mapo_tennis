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
      // 검색어 정규화 (공백 제거 및 소문자 변환)
      const normalizedSearch = search.trim().toLowerCase();

      // 숫자인지 확인
      const isNumeric = !isNaN(parseInt(normalizedSearch)) && normalizedSearch !== '';

      // 이름, 클럽명, 점수로 검색
      query += ` && (
        lower(name) match "*${normalizedSearch}*" || 
        lower(email) match "*${normalizedSearch}*" || 
        phone match "*${normalizedSearch}*" ||
        ${isNumeric ? `score == ${parseInt(normalizedSearch)} ||` : ''}
        lower(clubs[]->name) match "*${normalizedSearch}*"
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

    // 클럽 정보도 함께 가져오기
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
        // clubMember의 role 정보 포함 (이메일과 이름 모두로 매칭 시도)
        "role": *[_type == 'clubMember' && (email == ^.^.email) && club._ref == ^._id][0].role,
      }
    }`;

    // 전체 개수 조회
    let countQuery = `count(*[_type == "user"`;
    if (search) {
      // 검색어 정규화 (공백 제거 및 소문자 변환)
      const normalizedSearch = search.trim().toLowerCase();

      // 숫자인지 확인
      const isNumeric = !isNaN(parseInt(normalizedSearch)) && normalizedSearch !== '';

      // 이름, 클럽명, 점수로 검색
      countQuery += ` && (
        lower(name) match "*${normalizedSearch}*" || 
        lower(email) match "*${normalizedSearch}*" || 
        phone match "*${normalizedSearch}*" ||
        ${isNumeric ? `score == ${parseInt(normalizedSearch)} ||` : ''}
        lower(clubs[]->name) match "*${normalizedSearch}*"
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

import { NextRequest, NextResponse } from 'next/server';
import { createClub } from '@/service/club';
import type { Club } from '@/model/club';
import { getUserByEmail } from '@/service/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { client } from '@/sanity/lib/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const workDays = formData.get('workDays') as string;
    const location = formData.get('location') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const contact = formData.get('contact') as string;
    const members = JSON.parse((formData.get('members') as string) || '[]');
    const imageFile = formData.get('image') as File;

    console.log(formData);
    if (!name || !description) {
      return NextResponse.json({ error: '필수 정보 누락' }, { status: 400 });
    }
    // email로 user._id 조회
    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ error: '유저 정보 없음' }, { status: 400 });
    }

    let imageAssetRef = undefined;
    if (imageFile) {
      // Sanity asset 업로드
      const asset = await client.assets.upload('image', imageFile, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      imageAssetRef = {
        _type: 'image' as const,
        asset: { _type: 'reference' as const, _ref: asset._id },
      };
    }

    const clubData: Omit<Club, '_id' | '_type'> = {
      name,
      description,
      workDays,
      location,
      isPublic,
      contact,
      image: imageAssetRef,
      createdBy: { _type: 'reference', _ref: user._id },
      members,
    };
    console.log(clubData);
    const result = await createClub(clubData);
    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getClubs, createClub, deleteClub, uploadClubImage, updateClub } from '@/service/club';
import type { Club } from '@/model/club';
import { getUserByEmail } from '@/service/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clubs = await getClubs();
    if (id) {
      const club = clubs.find((c) => c._id === id);
      if (!club) return NextResponse.json({ error: '클럽을 찾을 수 없습니다.' }, { status: 404 });
      return NextResponse.json({ club });
    }
    return NextResponse.json({ clubs });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
      const asset = await uploadClubImage(imageFile);
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

    const result = await createClub(clubData);
    return NextResponse.json({ ok: true, id: result._id });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id 파라미터가 필요합니다.' }, { status: 400 });
    }
    await deleteClub(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id 파라미터가 필요합니다.' }, { status: 400 });
    }
    const formData = await req.formData();
    const updateFields: Record<string, unknown> = {};
    const updatableFields = [
      'name',
      'description',
      'workDays',
      'location',
      'isPublic',
      'contact',
      'members',
    ];
    updatableFields.forEach((field) => {
      const value = formData.get(field);
      if (value !== null) {
        updateFields[field] = field === 'isPublic' ? value === 'true' : value;
      }
    });
    if (updateFields.members) {
      updateFields.members = JSON.parse(updateFields.members as string);
    }
    // 이미지 삭제 처리: 'image' 필드가 문자열 'null'로 오면 실제로 null로 반영
    if (formData.get('image') === 'null') {
      updateFields.image = null;
    } else {
      const imageFile = formData.get('image') as File;
      if (imageFile && imageFile.size > 0) {
        const asset = await uploadClubImage(imageFile);
        updateFields.image = {
          _type: 'image' as const,
          asset: { _type: 'reference' as const, _ref: asset._id },
        };
      }
    }
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: '수정할 필드가 없습니다.' }, { status: 400 });
    }
    await updateClub(id, updateFields);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류', detail: String(e) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '../../../../service/user';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }
  const user = await getUserByEmail(email);
  return NextResponse.json({ user: user || null });
}

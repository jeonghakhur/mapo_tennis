import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import TournamentApplicationsAdminPage from './TournamentApplicationsAdminPage';

// 서버 컴포넌트에서 권한 체크
export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // 로그인 체크
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // 권한 레벨 체크 (레벨 5 이상만 접근 가능)
  const userLevel = session.user.level ?? 0;
  if (userLevel < 5) {
    redirect('/access-denied');
  }

  return <TournamentApplicationsAdminPage />;
}

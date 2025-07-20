// 이 파일은 예시용입니다.
//
// 새로운 권한 시스템 사용 예시:
//
// 1. 관리자 전용 API (레벨 5 이상)
// export async function GET(req: NextRequest) {
//   return withPermission(req, PERMISSION_LEVELS.ADMIN, async (req) => {
//     // 관리자 전용 로직
//   });
// }
//
// 2. 포스트 관리자 API (레벨 4 이상)
// export async function POST(req: NextRequest) {
//   return withPermission(req, PERMISSION_LEVELS.POST_MANAGER, async (req) => {
//     // 포스트 관리 로직
//   });
// }
//
// 3. 고급 사용자 API (레벨 3 이상)
// export async function PATCH(req: NextRequest) {
//   return withPermission(req, PERMISSION_LEVELS.ADVANCED_USER, async (req) => {
//     // 고급 사용자 로직
//   });
// }

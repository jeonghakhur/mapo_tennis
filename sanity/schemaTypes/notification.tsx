import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'notification',
  title: '알림',
  type: 'document',
  fields: [
    defineField({
      name: 'type',
      title: '알림 타입',
      type: 'string',
      options: {
        list: [
          { title: '생성', value: 'CREATE' },
          { title: '수정', value: 'UPDATE' },
          { title: '삭제', value: 'DELETE' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'entityType',
      title: '엔티티 타입',
      type: 'string',
      options: {
        list: [
          { title: '클럽 회원', value: 'CLUB_MEMBER' },
          { title: '클럽', value: 'CLUB' },
          { title: '게시글', value: 'POST' },
          { title: '참가신청', value: 'TOURNAMENT_APPLICATION' },
          { title: '사용자', value: 'USER' },
          { title: '지출내역', value: 'EXPENSE' },
          { title: '토너먼트', value: 'TOURNAMENT' },
          { title: '문의', value: 'QUESTION' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'entityId',
      title: '엔티티 ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: '알림 제목',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'message',
      title: '알림 메시지',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      title: '바로가기 링크',
      type: 'string',
      description: '알림 클릭 시 이동할 페이지 URL',
    }),
    defineField({
      name: 'changes',
      title: '변경사항',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'field', title: '필드명', type: 'string' },
            { name: 'oldValue', title: '이전 값', type: 'string' },
            { name: 'newValue', title: '새 값', type: 'string' },
          ],
        },
      ],
    }),
    defineField({
      name: 'targetUsers',
      title: '대상 사용자 목록',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],
      description: '특정 사용자들에게만 보내는 경우 (비어있으면 모든 사용자에게)',
    }),
    defineField({
      name: 'requiredLevel',
      title: '필요 권한 레벨',
      type: 'number',
      options: {
        list: [
          { title: '레벨 1 (클럽가입회원)', value: 1 },
          { title: '레벨 2 (클럽관리자)', value: 2 },
          { title: '레벨 3 (협회 관계자)', value: 3 },
          { title: '레벨 4 (경기관리자)', value: 4 },
          { title: '레벨 5 (어드민)', value: 5 },
        ],
      },
      validation: (Rule) => Rule.required(),
      description: '이 알림을 볼 수 있는 최소 권한 레벨',
    }),
    defineField({
      name: 'createdAt',
      title: '생성 시간',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      entityType: 'entityType',
      createdAt: 'createdAt',
    },
    prepare({ title, type, entityType, createdAt }) {
      return {
        title,
        subtitle: `${type} - ${entityType} (${new Date(createdAt).toLocaleDateString()})`,
      };
    },
  },
});

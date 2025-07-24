import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'clubMember',
  type: 'document',
  title: '클럽 회원',
  fields: [
    defineField({
      name: 'club',
      type: 'reference',
      to: [{ type: 'club' }],
      title: '소속 클럽',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'user',
      type: 'string',
      title: '회원명',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      type: 'string',
      title: '직위',
      options: { list: ['회장', '부회장', '총무', '고문', '경기이사', '회원', '기타'] },
    }),
    defineField({
      name: 'birth',
      type: 'string',
      title: '출생년도(4자리)',
      description: '예: 2002',
      validation: (Rule) => Rule.regex(/^\d{4}$/).error('4자리 연도(예: 2002)로 입력하세요.'),
    }),
    defineField({
      name: 'tennisStartYear',
      type: 'string',
      title: '테니스 입문년도',
      description: '예: 2015',
      validation: (Rule) => Rule.regex(/^\d{4}$/).error('4자리 연도(예: 2015)로 입력하세요.'),
    }),
    defineField({
      name: 'gender',
      type: 'string',
      title: '성별',
      options: { list: ['남', '여'] },
    }),
    defineField({
      name: 'score',
      type: 'number',
      title: '회원점수',
    }),
    defineField({
      name: 'email',
      type: 'string',
      title: '이메일',
    }),
    defineField({
      name: 'joinedAt',
      type: 'datetime',
      title: '가입일',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'leftAt',
      type: 'datetime',
      title: '탈퇴일',
    }),
    defineField({
      name: 'status',
      type: 'string',
      title: '회원활동 여부',
      options: { list: ['정회원', '휴회원', '탈퇴회원'] },
    }),
    defineField({
      name: 'contact',
      type: 'string',
      title: '연락처',
      description: '선택',
    }),
    defineField({
      name: 'memo',
      type: 'text',
      title: '비고',
      description: '관리자 메모 등(선택)',
    }),
    defineField({
      name: 'approvedByAdmin',
      title: '관리자 승인 여부',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'user',
      club: 'club.name',
      role: 'role',
      status: 'status',
    },
    prepare({ title, club, role, status }) {
      return {
        title: title || '이름 없음',
        subtitle: `${club || '클럽 없음'} - ${role || '직위 없음'} (${status || '상태 없음'})`,
      };
    },
  },
});

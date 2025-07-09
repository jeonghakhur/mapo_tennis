import type { Rule } from 'sanity';

export const club = {
  name: 'club',
  type: 'document',
  title: '클럽',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: '클럽명',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'description',
      type: 'text',
      title: '소개글',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'workDays',
      type: 'string',
      title: '운동일',
    },
    {
      name: 'location',
      type: 'string',
      title: '운동장소',
    },
    {
      name: 'isPublic',
      type: 'boolean',
      title: '공개 클럽 여부',
      initialValue: true,
    },
    {
      name: 'contact',
      type: 'string',
      title: '연락처',
    },
    {
      name: 'image',
      type: 'image',
      title: '대표 이미지',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'createdBy',
      type: 'reference',
      to: [{ type: 'user' }],
      title: '생성자',
      description: '클럽을 생성한 사용자',
      readOnly: true,
    },
    {
      name: 'members',
      type: 'array',
      title: '클럽 회원',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: '성명',
              validation: (Rule: Rule) => Rule.required(),
            },
            {
              name: 'role',
              type: 'string',
              title: '직위',
              options: { list: ['회장', '부회장', '회원', '기타'] },
            },
            { name: 'birth', type: 'string', title: '생년월일' },
            {
              name: 'gender',
              type: 'string',
              title: '성별',
              options: { list: ['남성', '여성', '기타'] },
            },
            {
              name: 'joinedAt',
              type: 'datetime',
              title: '가입일',
              validation: (Rule: Rule) => Rule.required(),
            },
            { name: 'leftAt', type: 'datetime', title: '탈퇴일' },
            {
              name: 'isApproved',
              type: 'boolean',
              title: '회원활동 승인여부',
              initialValue: false,
            },
            {
              name: 'userRef',
              type: 'reference',
              to: [{ type: 'user' }],
              title: '회원(user) 참조',
              description: '실제 회원 계정과 연결(선택)',
            },
            { name: 'contact', type: 'string', title: '연락처', description: '선택' },
            { name: 'memo', type: 'text', title: '비고', description: '관리자 메모 등(선택)' },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
      media: 'image',
    },
    prepare({ title, subtitle, media }: Record<string, unknown>) {
      return {
        title: typeof title === 'string' ? title : '',
        subtitle: typeof subtitle === 'string' ? subtitle : '',
        media: typeof media === 'string' ? media : undefined,
      };
    },
  },
};

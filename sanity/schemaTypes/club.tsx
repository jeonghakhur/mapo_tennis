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
    // 회원 관련 필드 삭제됨
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

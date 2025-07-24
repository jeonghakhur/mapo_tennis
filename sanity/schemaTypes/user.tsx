import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'user',
  title: '사용자',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: '이메일',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'name',
      title: '이름',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: '프로필 이미지',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'role',
      title: '역할',
      type: 'string',
      options: {
        list: [
          { title: '일반 사용자', value: 'user' },
          { title: '관리자', value: 'admin' },
        ],
      },
      initialValue: 'user',
    }),
    defineField({
      name: 'permissionLevel',
      title: '권한 레벨',
      type: 'number',
      description: '0: 일반 사용자, 1: 클럽 회원, 2: 클럽 관리자, 3: 협회 임원, 4: 최고 관리자',
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0).max(4),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || '이름 없음',
        subtitle: subtitle || '이메일 없음',
        media: media,
      };
    },
  },
});

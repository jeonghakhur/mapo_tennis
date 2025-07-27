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
      name: 'address',
      title: '주소',
      type: 'string',
    }),
    defineField({
      name: 'birth',
      title: '생년월일',
      type: 'string',
    }),
    defineField({
      name: 'clubs',
      title: '클럽',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'club' }] }],
    }),
    defineField({
      name: 'gender',
      title: '성별',
      type: 'string',
    }),
    defineField({
      name: 'isApprovedUser',
      title: '승인된 유저',
      type: 'boolean',
    }),
    defineField({
      name: 'level',
      title: '레벨',
      type: 'number',
    }),
    defineField({
      name: 'phone',
      title: '전화번호',
      type: 'string',
    }),
    defineField({
      name: 'score',
      title: '점수',
      type: 'number',
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

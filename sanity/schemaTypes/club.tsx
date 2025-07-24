import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'club',
  type: 'document',
  title: '클럽',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: '클럽명',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: '소개글',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'workDays',
      type: 'string',
      title: '운동일',
    }),
    defineField({
      name: 'location',
      type: 'string',
      title: '운동장소',
    }),
    defineField({
      name: 'isPublic',
      type: 'boolean',
      title: '공개 클럽 여부',
      initialValue: true,
    }),
    defineField({
      name: 'contact',
      type: 'string',
      title: '연락처',
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: '대표 이미지',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'createdBy',
      type: 'reference',
      to: [{ type: 'user' }],
      title: '생성자',
      description: '클럽을 생성한 사용자',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: typeof title === 'string' ? title : '',
        subtitle: typeof subtitle === 'string' ? subtitle : '',
        media: typeof media === 'string' ? media : undefined,
      };
    },
  },
});

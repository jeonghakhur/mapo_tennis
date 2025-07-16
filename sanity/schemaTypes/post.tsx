import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'post',
  title: '포스트',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '제목',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: '내용',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: '작성자',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: '카테고리',
      type: 'string',
      options: {
        list: [
          { title: '공지사항', value: 'notice' },
          { title: '이벤트', value: 'event' },
          { title: '일반', value: 'general' },
          { title: '대회일정', value: 'tournament_schedule' },
          { title: '대회요강', value: 'tournament_info' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isPublished',
      title: '발행 여부',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      title: '발행일',
      type: 'datetime',
    }),
    defineField({
      name: 'createdAt',
      title: '생성일',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: '수정일',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'attachments',
      title: '첨부파일',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'filename',
              title: '파일명',
              type: 'string',
            },
            {
              name: 'url',
              title: '파일 URL',
              type: 'url',
            },
            {
              name: 'size',
              title: '파일 크기',
              type: 'number',
            },
            {
              name: 'type',
              title: '파일 타입',
              type: 'string',
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author',
      category: 'category',
      isPublished: 'isPublished',
      createdAt: 'createdAt',
    },
    prepare({ title, author, category, isPublished, createdAt }) {
      const categoryMap = {
        notice: '공지사항',
        event: '이벤트',
        general: '일반',
      };

      return {
        title,
        subtitle: `${author} • ${categoryMap[category as keyof typeof categoryMap]} • ${isPublished ? '발행됨' : '임시저장'} (${new Date(createdAt).toLocaleDateString()})`,
      };
    },
  },
});

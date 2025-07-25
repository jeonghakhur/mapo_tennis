import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'question',
  title: '1:1 문의',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '제목',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'content',
      title: '내용',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'attachments',
      title: '첨부 이미지',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'filename', title: '파일명', type: 'string' },
            { name: 'size', title: '파일 크기', type: 'number' },
            { name: 'type', title: '파일 타입', type: 'string' },
          ],
        },
      ],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'author',
      title: '작성자',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: '답변',
      type: 'text',
    }),
    defineField({
      name: 'answeredBy',
      title: '답변자',
      type: 'reference',
      to: [{ type: 'user' }],
    }),
    defineField({
      name: 'answeredAt',
      title: '답변일',
      type: 'datetime',
    }),
    defineField({
      name: 'createdAt',
      title: '생성일',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      createdAt: 'createdAt',
      answeredAt: 'answeredAt',
    },
    prepare({ title, author, createdAt, answeredAt }) {
      return {
        title,
        subtitle: `${author ? author : '작성자 미상'} • 문의일: ${createdAt ? new Date(createdAt).toLocaleDateString() : ''}${answeredAt ? ' • 답변완료' : ''}`,
      };
    },
  },
});

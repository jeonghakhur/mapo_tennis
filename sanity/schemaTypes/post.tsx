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
      type: 'reference',
      to: [{ type: 'user' }],
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
          { title: '대회규칙', value: 'tournament_rules' },
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
      initialValue: () => new Date().toISOString(),
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
    defineField({
      name: 'showOnMain',
      title: '메인에 노출',
      type: 'boolean',
      initialValue: false,
      description: '메인 화면에 노출할지 여부',
    }),
    defineField({
      name: 'mainPriority',
      title: '메인 노출 우선순위',
      type: 'number',
      initialValue: 0,
      description: '메인 노출 시 우선순위(낮을수록 먼저)',
    }),
    defineField({
      name: 'likeCount',
      title: '좋아요 수',
      type: 'number',
      initialValue: 0,

      description: '좋아요를 누른 사용자 수',
    }),
    defineField({
      name: 'likedBy',
      title: '좋아요를 누른 사용자들',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'user' }] }],

      description: '좋아요를 누른 사용자 목록',
    }),
    defineField({
      name: 'commentCount',
      title: '코멘트 수',
      type: 'number',

      description: '코멘트 개수',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      category: 'category',
      isPublished: 'isPublished',
      createdAt: 'createdAt',
    },
    prepare({ title, author, category, isPublished, createdAt }) {
      const categoryMap = {
        notice: '공지사항',
        event: '이벤트',
        general: '일반',
        tournament_rules: '대회규칙',
        tournament_info: '대회요강',
      };

      return {
        title,
        subtitle: `${author} • ${categoryMap[category as keyof typeof categoryMap]} • ${isPublished ? '발행됨' : '임시저장'} (${new Date(createdAt).toLocaleDateString()})`,
      };
    },
  },
});

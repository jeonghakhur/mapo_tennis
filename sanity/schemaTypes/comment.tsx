import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'comment',
  title: '코멘트',
  type: 'document',
  fields: [
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
      name: 'post',
      title: '포스트',
      type: 'reference',
      to: [{ type: 'post' }],
      validation: (Rule) => Rule.required(),
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
  ],
  preview: {
    select: {
      title: 'content',
      author: 'author.name',
      post: 'post.title',
      createdAt: 'createdAt',
    },
    prepare({ title, author, post, createdAt }) {
      return {
        title: title?.substring(0, 50) + (title?.length > 50 ? '...' : ''),
        subtitle: `${author} • ${post} • ${new Date(createdAt).toLocaleDateString()}`,
      };
    },
  },
});

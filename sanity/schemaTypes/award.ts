import type { Rule } from 'sanity';

export const award = {
  name: 'award',
  type: 'document',
  title: '입상기록',
  fields: [
    {
      name: 'competition',
      type: 'string',
      title: '대회명',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'date',
      type: 'string', // 또는 'date'
      title: '일자',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'division',
      type: 'string',
      title: '부서구분',
      options: { list: ['마스터부', '챌린저부', '퓨처스부'] },
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'prize',
      type: 'string',
      title: '수상구분',
      options: { list: ['우승', '준우승', '3위'] },
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'player',
      type: 'reference',
      to: [{ type: 'clubMember' }],
      title: '회원명',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'club',
      type: 'reference',
      to: [{ type: 'club' }],
      title: '클럽명',
      validation: (Rule: Rule) => Rule.required(),
    },
  ],
};

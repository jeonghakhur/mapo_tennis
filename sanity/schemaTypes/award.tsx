import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'award',
  title: '수상 결과',
  type: 'document',
  fields: [
    defineField({
      name: 'competition',
      title: '대회명',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: '년도',
      type: 'number',
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'division',
      title: '부서구분',
      type: 'string',
      description: '예: 마스터부, 챌린저부, 퓨처스부, 국화부, 개나리부 등',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'awardCategory',
      title: '수상구분',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'players',
      title: '선수명',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'club',
      title: '클럽명',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: '정렬 순서',
      type: 'number',
    }),
    defineField({
      name: 'gameType',
      title: '게임 유형',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'competition',
      year: 'year',
      division: 'division',
      awardCategory: 'awardCategory',
      club: 'club',
    },
    prepare(selection) {
      const { title, year, division, awardCategory, club } = selection;
      const divisionLabels: Record<string, string> = {
        master: '마스터부',
        challenger: '챌린저부',
        futures: '퓨처스부',
      };
      const awardLabels: Record<string, string> = {
        winner: '우승',
        'runner-up': '준우승',
        third: '3위',
      };

      return {
        title: `${title} (${year})`,
        subtitle: `${divisionLabels[division as keyof typeof divisionLabels]} ${awardLabels[awardCategory as keyof typeof awardLabels]} - ${club}`,
      };
    },
  },
});

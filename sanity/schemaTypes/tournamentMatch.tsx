import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'tournamentMatch',
  title: '대회 경기',
  type: 'document',
  fields: [
    defineField({
      name: 'tournamentId',
      title: '대회 ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'division',
      title: '부서',
      type: 'string',
      options: {
        list: [
          { title: '마스터부', value: 'master' },
          { title: '챌린저부', value: 'challenger' },
          { title: '퓨처스부', value: 'futures' },
          { title: '개나리부', value: 'forsythia' },
          { title: '국화부', value: 'chrysanthemum' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'groupId',
      title: '조 ID (예선 경기인 경우)',
      type: 'string',
    }),
    defineField({
      name: 'round',
      title: '라운드 (본선 경기인 경우)',
      type: 'number',
      description: '16강=1, 8강=2, 4강=3, 결승=4',
    }),
    defineField({
      name: 'matchNumber',
      title: '경기 번호',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'team1',
      title: '팀 1',
      type: 'object',
      fields: [
        {
          name: 'teamId',
          title: '팀 ID',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'teamName',
          title: '팀 이름',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'score',
          title: '점수',
          type: 'number',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'team2',
      title: '팀 2',
      type: 'object',
      fields: [
        {
          name: 'teamId',
          title: '팀 ID',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'teamName',
          title: '팀 이름',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'score',
          title: '점수',
          type: 'number',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'winner',
      title: '승자 팀 ID',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: '경기 상태',
      type: 'string',
      options: {
        list: [
          { title: '예정', value: 'scheduled' },
          { title: '진행중', value: 'in_progress' },
          { title: '완료', value: 'completed' },
          { title: '취소', value: 'cancelled' },
        ],
      },
      initialValue: 'scheduled',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'scheduledTime',
      title: '예정 시간',
      type: 'datetime',
    }),
    defineField({
      name: 'court',
      title: '코트 번호',
      type: 'string',
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
      title: 'matchNumber',
      team1: 'team1.teamName',
      team2: 'team2.teamName',
      status: 'status',
      division: 'division',
    },
    prepare(selection) {
      const { title, team1, team2, status, division } = selection;
      const statusLabels = {
        scheduled: '예정',
        in_progress: '진행중',
        completed: '완료',
        cancelled: '취소',
      };
      const divisionLabels = {
        master: '마스터부',
        challenger: '챌린저부',
        futures: '퓨처스부',
        forsythia: '개나리부',
        chrysanthemum: '국화부',
      };
      return {
        title: `${team1} vs ${team2}`,
        subtitle: `${divisionLabels[division as keyof typeof divisionLabels] || division} • ${statusLabels[status as keyof typeof statusLabels] || status} • ${title}경기`,
      };
    },
  },
});

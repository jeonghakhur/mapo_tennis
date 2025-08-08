import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'tournamentGroup',
  title: '대회 조편성',
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
      title: '조 ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: '조 이름',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'teams',
      title: '팀 목록',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'team',
          title: '팀 정보',
          fields: [
            {
              name: 'teamId',
              title: '팀 ID',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'name',
              title: '팀 이름',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'seed',
              title: '시드 번호',
              type: 'number',
            },
            {
              name: 'members',
              title: '팀원 목록',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'member',
                  title: '팀원 정보',
                  fields: [
                    {
                      name: 'memberKey',
                      title: '고유 키',
                      type: 'string',
                    },
                    {
                      name: 'name',
                      title: '이름',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'clubId',
                      title: '클럽 ID',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'clubName',
                      title: '클럽 이름',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'birth',
                      title: '생년월일',
                      type: 'string',
                    },
                    {
                      name: 'score',
                      title: '점수',
                      type: 'number',
                    },
                    {
                      name: 'isRegisteredMember',
                      title: '등록 회원 여부',
                      type: 'boolean',
                      initialValue: false,
                    },
                  ],
                },
              ],
            },
            {
              name: 'createdAt',
              title: '생성일',
              type: 'datetime',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'createdAt',
      title: '생성일',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'createdBy',
      title: '생성자',
      type: 'string',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      tournamentId: 'tournamentId',
      division: 'division',
    },
    prepare(selection) {
      const { title, tournamentId, division } = selection;
      const divisionLabels = {
        master: '마스터부',
        challenger: '챌린저부',
        futures: '퓨처스부',
        forsythia: '개나리부',
        chrysanthemum: '국화부',
      };
      return {
        title: `${title} (${divisionLabels[division as keyof typeof divisionLabels] || division})`,
        subtitle: `대회: ${tournamentId}`,
      };
    },
  },
});

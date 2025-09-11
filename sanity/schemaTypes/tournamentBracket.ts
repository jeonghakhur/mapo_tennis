import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'tournamentBracket',
  title: '본선 대진표',
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
      name: 'matches',
      title: '경기 목록',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'match',
          fields: [
            defineField({
              name: 'round',
              title: '라운드',
              type: 'string',
              options: {
                list: [
                  { title: '32강', value: 'round32' },
                  { title: '16강', value: 'round16' },
                  { title: '8강', value: 'quarterfinal' },
                  { title: '4강', value: 'semifinal' },
                  { title: '결승', value: 'final' },
                ],
              },
              validation: (Rule) => Rule.required(),
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
                defineField({
                  name: 'teamId',
                  title: '팀 ID',
                  type: 'string',
                }),
                defineField({
                  name: 'teamName',
                  title: '팀명',
                  type: 'string',
                }),
                defineField({
                  name: 'score',
                  title: '점수',
                  type: 'number',
                }),
                defineField({
                  name: 'sets',
                  title: '세트별 점수',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        {
                          name: 'setNumber',
                          title: '세트 번호',
                          type: 'number',
                          validation: (Rule) => Rule.required().min(1).max(5),
                        },
                        {
                          name: 'games',
                          title: '게임 수',
                          type: 'number',
                          validation: (Rule) => Rule.required().min(0).max(7),
                        },
                        {
                          name: 'tiebreak',
                          title: '타이브레이크 점수',
                          type: 'number',
                          description: '타이브레이크가 있는 경우에만 입력',
                        },
                        {
                          name: 'players',
                          title: '선수명',
                          type: 'array',
                          of: [
                            {
                              type: 'string',
                            },
                          ],
                          validation: (Rule) => Rule.max(2),
                          description: '해당 세트에 참여한 선수명 (최대 2명)',
                        },
                      ],
                    },
                  ],
                  validation: (Rule) => Rule.max(5),
                }),
                defineField({
                  name: 'totalSetsWon',
                  title: '승리한 세트 수',
                  type: 'number',
                  readOnly: true,
                  description: '자동으로 계산됩니다',
                }),
              ],
            }),
            defineField({
              name: 'team2',
              title: '팀 2',
              type: 'object',
              fields: [
                defineField({
                  name: 'teamId',
                  title: '팀 ID',
                  type: 'string',
                }),
                defineField({
                  name: 'teamName',
                  title: '팀명',
                  type: 'string',
                }),
                defineField({
                  name: 'score',
                  title: '점수',
                  type: 'number',
                }),
                defineField({
                  name: 'sets',
                  title: '세트별 점수',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        {
                          name: 'setNumber',
                          title: '세트 번호',
                          type: 'number',
                          validation: (Rule) => Rule.required().min(1).max(5),
                        },
                        {
                          name: 'games',
                          title: '게임 수',
                          type: 'number',
                          validation: (Rule) => Rule.required().min(0).max(7),
                        },
                        {
                          name: 'tiebreak',
                          title: '타이브레이크 점수',
                          type: 'number',
                          description: '타이브레이크가 있는 경우에만 입력',
                        },
                        {
                          name: 'players',
                          title: '선수명',
                          type: 'array',
                          of: [
                            {
                              type: 'string',
                            },
                          ],
                          validation: (Rule) => Rule.max(2),
                          description: '해당 세트에 참여한 선수명 (최대 2명)',
                        },
                      ],
                    },
                  ],
                  validation: (Rule) => Rule.max(5),
                }),
                defineField({
                  name: 'totalSetsWon',
                  title: '승리한 세트 수',
                  type: 'number',
                  readOnly: true,
                  description: '자동으로 계산됩니다',
                }),
              ],
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
            }),
            defineField({
              name: 'court',
              title: '코트',
              type: 'string',
            }),
            defineField({
              name: 'winner',
              title: '승자 팀 ID',
              type: 'string',
            }),
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
      name: 'updatedAt',
      title: '수정일',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      tournamentId: 'tournamentId',
      division: 'division',
      matchCount: 'matches.length',
    },
    prepare({ tournamentId, division, matchCount }) {
      const divisionLabels: { [key: string]: string } = {
        master: '마스터부',
        challenger: '챌린저부',
        futures: '퓨처스부',
        forsythia: '개나리부',
        chrysanthemum: '국화부',
      };

      return {
        title: `${tournamentId} - ${divisionLabels[division] || division}`,
        subtitle: `${matchCount || 0}경기`,
      };
    },
  },
});

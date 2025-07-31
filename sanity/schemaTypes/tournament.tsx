import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'tournament',
  title: '테니스 대회',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '대회명',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: '시작일',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: '종료일',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: '장소',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tournamentType',
      title: '대회 유형',
      type: 'string',
      options: {
        list: [
          { title: '개인전', value: 'individual' },
          { title: '단체전', value: 'team' },
        ],
      },
      initialValue: 'individual',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'registrationStartDate',
      title: '등록 시작일',
      type: 'date',
    }),
    defineField({
      name: 'registrationDeadline',
      title: '등록 마감일',
      type: 'date',
    }),
    defineField({
      name: 'status',
      title: '상태',
      type: 'string',
      options: {
        list: [
          { title: '예정', value: 'upcoming' },
          { title: '진행중', value: 'ongoing' },
          { title: '완료', value: 'completed' },
          { title: '취소', value: 'cancelled' },
        ],
      },
      initialValue: 'upcoming',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isDraft',
      title: '임시저장 여부',
      type: 'boolean',
      initialValue: true,
      description: '임시저장 상태인지 여부를 나타냅니다',
    }),
    defineField({
      name: 'descriptionPostId',
      title: '대회 설명 포스트 ID',
      type: 'string',
      description: '대회 설명이 포함된 포스트의 ID를 입력하세요',
    }),
    defineField({
      name: 'rulesPostId',
      title: '대회 규칙 포스트 ID',
      type: 'string',
      description: '대회 규칙이 포함된 포스트의 ID를 입력하세요',
    }),
    defineField({
      name: 'entryFee',
      title: '참가비',
      type: 'number',
      description: '대회 참가비를 입력하세요',
    }),
    defineField({
      name: 'bankAccount',
      title: '입금계좌',
      type: 'string',
      description: '참가비 입금 계좌를 입력하세요',
    }),
    defineField({
      name: 'accountHolder',
      title: '예금주',
      type: 'string',
      description: '계좌 예금주를 입력하세요',
    }),
    defineField({
      name: 'host',
      title: '주최',
      type: 'string',
      description: '주최 단체 또는 인물',
    }),
    defineField({
      name: 'organizer',
      title: '주관',
      type: 'string',
      description: '주관 단체 또는 인물',
    }),
    defineField({
      name: 'participants',
      title: '참가인원',
      type: 'string',
      description: '예: 100명(남 60, 여 40)',
    }),
    defineField({
      name: 'registrationMethod',
      title: '접수방법',
      type: 'string',
      description: '대회 접수 방법을 입력하세요',
    }),
    defineField({
      name: 'drawMethod',
      title: '대진추첨',
      type: 'string',
      description: '대진 추첨 방법을 입력하세요',
    }),
    defineField({
      name: 'equipment',
      title: '대회사용구',
      type: 'string',
      description: '대회에서 사용할 구기류를 입력하세요',
    }),
    defineField({
      name: 'memo',
      title: '메모',
      type: 'text',
      description: '기타 참고사항을 입력하세요',
    }),
    defineField({
      name: 'divisions',
      title: '참가부서 및 상세정보',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'division',
          title: '부서 정보',
          fields: [
            {
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
            },
            {
              name: 'teamCount',
              title: '참가팀수',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'matchDates',
              title: '시합일',
              type: 'array',
              of: [{ type: 'string' }],
            },
            {
              name: 'startTime',
              title: '시작시간',
              type: 'string',
            },
            {
              name: 'prizes',
              title: '시상금',
              type: 'object',
              fields: [
                {
                  name: 'first',
                  title: '우승상금',
                  type: 'number',
                  initialValue: 0,
                },
                {
                  name: 'second',
                  title: '준우승상금',
                  type: 'number',
                  initialValue: 0,
                },
                {
                  name: 'third',
                  title: '3위상금',
                  type: 'number',
                  initialValue: 0,
                },
              ],
            },
          ],
        },
      ],
      description: '참가하는 부서와 각 부서별 상세 정보를 입력하세요',
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
      name: 'createdBy',
      title: '생성자',
      type: 'string',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      status: 'status',
    },
    prepare(selection) {
      const { title, startDate, status } = selection;
      const statusLabels = {
        upcoming: '예정',
        ongoing: '진행중',
        completed: '완료',
        cancelled: '취소',
      };
      return {
        title,
        subtitle: `${statusLabels[status as keyof typeof statusLabels] || status} • ${startDate ? new Date(startDate).toLocaleDateString('ko-KR') : ''}`,
      };
    },
  },
});

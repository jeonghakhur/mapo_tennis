import type { Rule } from 'sanity';

export const tournamentApplication = {
  name: 'tournamentApplication',
  type: 'document',
  title: '대회 참가 신청',
  fields: [
    {
      name: 'tournamentId',
      type: 'string',
      title: '대회 ID',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'division',
      type: 'string',
      title: '참가부서',
      options: {
        list: [
          { title: '마스터부', value: 'master' },
          { title: '챌린저부', value: 'challenger' },
          { title: '퓨처스부', value: 'futures' },
          { title: '국화부', value: 'chrysanthemum' },
          { title: '개나리부', value: 'forsythia' },
        ],
      },
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'tournamentType',
      type: 'string',
      title: '대회 유형',
      options: {
        list: [
          { title: '개인전', value: 'individual' },
          { title: '단체전', value: 'team' },
        ],
      },
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'teamMembers',
      type: 'array',
      title: '참가자 목록',
      description: '개인전은 2명, 단체전은 6-8명의 참가자를 입력하세요',
      validation: (Rule: Rule) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: '이름',
              validation: (Rule: Rule) => Rule.required(),
            },
            {
              name: 'clubId',
              type: 'string',
              title: '클럽 ID',
              validation: (Rule: Rule) => Rule.required(),
            },
            {
              name: 'clubName',
              type: 'string',
              title: '클럽명',
              validation: (Rule: Rule) => Rule.required(),
            },
            {
              name: 'birth',
              type: 'string',
              title: '생년월도',
              description: '예: 1990',
            },
            {
              name: 'score',
              type: 'number',
              title: '점수',
              description: '0-10 사이의 값',
            },
            {
              name: 'isRegisteredMember',
              type: 'boolean',
              title: '등록된 회원 여부',
              initialValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'contact',
      type: 'string',
      title: '연락처',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'email',
      type: 'string',
      title: '이메일',
    },
    {
      name: 'status',
      type: 'string',
      title: '신청 상태',
      options: {
        list: [
          { title: '대기중', value: 'pending' },
          { title: '승인', value: 'approved' },
          { title: '거절', value: 'rejected' },
          { title: '취소', value: 'cancelled' },
        ],
      },
      initialValue: 'pending',
      validation: (Rule: Rule) => Rule.required(),
    },
    {
      name: 'memo',
      type: 'text',
      title: '메모',
    },
    {
      name: 'isFeePaid',
      type: 'boolean',
      title: '참가비 납부 여부',
      initialValue: false,
    },
    {
      name: 'createdAt',
      type: 'datetime',
      title: '신청일',
      readOnly: true,
    },
    {
      name: 'updatedAt',
      type: 'datetime',
      title: '수정일',
      readOnly: true,
    },
    {
      name: 'createdBy',
      type: 'string',
      title: '신청자 ID',
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'teamMembers.0.name',
      subtitle: 'division',
      status: 'status',
      tournamentId: 'tournamentId',
      memberCount: 'teamMembers',
    },
    prepare(selection: {
      title?: string;
      subtitle?: string;
      status?: string;
      memberCount?: Array<{ name: string }>;
    }) {
      const { title, subtitle, status, memberCount } = selection;
      const statusLabels = {
        pending: '대기중',
        approved: '승인',
        rejected: '거절',
        cancelled: '취소',
      };
      const divisionLabels = {
        master: '마스터부',
        challenger: '챌린저부',
        futures: '퓨처스부',
        chrysanthemum: '국화부',
        forsythia: '개나리부',
      };
      const memberCountText =
        memberCount && memberCount.length > 0 ? `외 ${memberCount.length - 1}명` : '';
      return {
        title: `${title}${memberCountText}`,
        subtitle: `${divisionLabels[subtitle as keyof typeof divisionLabels] || subtitle} • ${statusLabels[status as keyof typeof statusLabels] || status}`,
      };
    },
  },
};

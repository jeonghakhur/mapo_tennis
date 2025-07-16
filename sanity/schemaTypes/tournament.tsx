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
      name: 'currentParticipants',
      title: '현재 참가자 수',
      type: 'number',
      initialValue: 0,
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

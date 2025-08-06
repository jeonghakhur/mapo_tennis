import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'user',
  title: '사용자',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: '이메일',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'name',
      title: '이름',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: '프로필 이미지',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'address',
      title: '주소',
      type: 'string',
    }),
    defineField({
      name: 'birth',
      title: '생년월일',
      type: 'string',
    }),
    defineField({
      name: 'clubs',
      title: '클럽',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'club' }] }],
    }),
    defineField({
      name: 'gender',
      title: '성별',
      type: 'string',
    }),
    defineField({
      name: 'isApprovedUser',
      title: '승인된 유저',
      type: 'boolean',
    }),
    defineField({
      name: 'level',
      title: '레벨',
      type: 'number',
    }),
    defineField({
      name: 'phone',
      title: '전화번호',
      type: 'string',
    }),
    defineField({
      name: 'score',
      title: '점수',
      type: 'number',
    }),
    defineField({
      name: 'isActive',
      title: '활동 상태',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'deactivatedAt',
      title: '탈퇴 시각',
      type: 'datetime',
    }),
    defineField({
      name: 'deactivatedReason',
      title: '탈퇴 사유',
      type: 'string',
    }),
    defineField({
      name: 'reactivatedAt',
      title: '재가입 시각',
      type: 'datetime',
    }),
    defineField({
      name: 'lastActiveAt',
      title: '마지막 로그인',
      type: 'datetime',
    }),
    defineField({
      name: 'kakaoAccessToken',
      title: '카카오 액세스 토큰',
      type: 'string',
      description: '카카오톡 메시지 전송을 위한 액세스 토큰',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || '이름 없음',
        subtitle: subtitle || '이메일 없음',
        media: media,
      };
    },
  },
});

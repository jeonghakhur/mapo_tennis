/* eslint-disable @typescript-eslint/no-explicit-any */

import Image from 'next/image';

export const user = {
  name: 'user',
  type: 'document',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'email',
      type: 'string',
    },
    {
      name: 'level',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'birth',
      type: 'string',
      title: '생일',
    },
    {
      name: 'phone',
      type: 'string',
      title: '핸드폰번호',
    },
    {
      name: 'address',
      type: 'string',
      title: '거주지',
    },
    {
      name: 'gender',
      type: 'string',
      title: '성별',
    },
    {
      name: 'score',
      type: 'number',
      title: '점수',
    },
    {
      name: 'isApprovedUser',
      title: '승인 회원 여부',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'clubs',
      type: 'array',
      title: '가입 클럽',
      description: '사용자가 가입한 클럽 목록',
      of: [
        {
          type: 'reference',
          to: [{ type: 'club' }],
        },
      ],
    },
    // {
    //   name: 'following',
    //   type: 'array',
    //   of: [
    //     {
    //       type: 'reference',
    //       to: [{ type: 'user' }],
    //     },
    //   ],
    //   validation: (Rule: any) => Rule.unique(),
    // },
    // {
    //   name: 'followers',
    //   type: 'array',
    //   of: [
    //     {
    //       type: 'reference',
    //       to: [{ type: 'user' }],
    //     },
    //   ],
    //   validation: (Rule: any) => Rule.unique(),
    // },
    // {
    //   name: 'bookmarks',
    //   type: 'array',
    //   of: [
    //     {
    //       type: 'reference',
    //       to: [{ type: 'post' }],
    //     },
    //   ],
    //   validation: (Rule: any) => Rule.unique(),
    // },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'username',
      media: 'image',
    },
    prepare({ title, subtitle, media }: any) {
      return {
        title,
        subtitle,
        media: media ? <Image src={media} alt="" width={20} height={20} /> : '',
      };
    },
  },
};

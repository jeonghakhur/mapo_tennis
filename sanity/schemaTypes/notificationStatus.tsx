import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'notificationStatus',
  title: '알림 상태',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: '사용자',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
      description: '알림을 받은 사용자',
    }),
    defineField({
      name: 'notification',
      title: '알림 ID',
      type: 'reference',
      to: [{ type: 'notification' }],
      validation: (Rule) => Rule.required(),
      description: '해당 알림의 참조',
    }),
    defineField({
      name: 'isRead',
      title: '읽음 여부',
      type: 'boolean',
      initialValue: false,
      description: '사용자가 이 알림을 읽었는지 여부',
    }),
    defineField({
      name: 'isDeleted',
      title: '삭제 여부',
      type: 'boolean',
      initialValue: false,
      description: '사용자가 이 알림을 삭제했는지 여부',
    }),
    defineField({
      name: 'readAt',
      title: '읽은 시간',
      type: 'datetime',
      description: '알림을 읽은 시간',
    }),
    defineField({
      name: 'deletedAt',
      title: '삭제한 시간',
      type: 'datetime',
      description: '알림을 삭제한 시간',
    }),
    defineField({
      name: 'createdAt',
      title: '생성 시간',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      userName: 'user.name',
      userEmail: 'user.email',
      notificationTitle: 'notification.title',
      isRead: 'isRead',
      isDeleted: 'isDeleted',
      createdAt: 'createdAt',
    },
    prepare({ userName, userEmail, notificationTitle, isRead, isDeleted, createdAt }) {
      const status = isDeleted ? '삭제됨' : isRead ? '읽음' : '안읽음';
      return {
        title: `${userName || userEmail} - ${notificationTitle || '알림'}`,
        subtitle: `${status} (${new Date(createdAt).toLocaleDateString()})`,
      };
    },
  },
});

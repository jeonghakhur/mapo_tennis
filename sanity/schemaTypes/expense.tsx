import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'expense',
  title: '지출내역',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '제목',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'storeName',
      title: '매장명',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: '주소',
      type: 'string',
    }),
    defineField({
      name: 'amount',
      title: '금액',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'expenseType',
      title: '구분항목',
      type: 'string',
      options: {
        list: [
          { title: '협회비', value: 'association_fee' },
          { title: '발전기금', value: 'development_fund' },
          { title: '이사회비', value: 'board_fee' },
        ],
      },
    }),
    defineField({
      name: 'category',
      title: '카테고리',
      type: 'string',
      options: {
        list: [
          { title: '코트 대여료', value: 'court_rental' },
          { title: '장비 구매', value: 'equipment' },
          { title: '시설 유지보수', value: 'maintenance' },
          { title: '공과금', value: 'utilities' },
          { title: '보험료', value: 'insurance' },
          { title: '홍보/마케팅', value: 'marketing' },
          { title: '인건비', value: 'staff' },
          { title: '사무용품', value: 'office' },
          { title: '청소/위생', value: 'cleaning' },
          { title: '식비/음료', value: 'food' },
          { title: '교통비', value: 'transport' },
          { title: '행사', value: 'event' },
          { title: '기타', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: '지출일',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '설명',
      type: 'text',
    }),
    defineField({
      name: 'receiptImage',
      title: '영수증 이미지',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'productImage',
      title: '물품 이미지',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'extractedText',
      title: '추출된 텍스트',
      type: 'text',
      readOnly: true,
    }),
    defineField({
      name: 'attachments',
      title: '첨부파일',
      type: 'array',
      of: [{ type: 'file' }],
    }),
    defineField({
      name: 'author',
      title: '작성자',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
      title: 'title',
      amount: 'amount',
      category: 'category',
      date: 'date',
      author: 'author',
    },
    prepare({ title, amount, category, date, author }) {
      const categoryMap = {
        court_rental: '코트 대여료',
        equipment: '장비 구매',
        maintenance: '시설 유지보수',
        utilities: '공과금',
        insurance: '보험료',
        marketing: '홍보/마케팅',
        staff: '인건비',
        office: '사무용품',
        cleaning: '청소/위생',
        food: '식비/음료',
        transport: '교통비',
        event: '행사',
        other: '기타',
      };

      return {
        title,
        subtitle: `${categoryMap[category as keyof typeof categoryMap]} • ${amount?.toLocaleString()}원 • ${author} • ${date ? new Date(date).toLocaleDateString() : ''}`,
      };
    },
  },
});

export interface QuestionAttachment {
  filename: string;
  url: string;
  size: number;
  type: string; // image/* 만 허용
}

export interface Question {
  _id: string;
  _type: 'question';
  title: string;
  content: string; // HTML
  attachments?: QuestionAttachment[];
  author: { _id: string; name: string } | string;
  answer?: string; // HTML
  answeredBy?: { _id: string; name: string } | string;
  answeredAt?: string;
  createdAt: string;
}

export interface QuestionInput {
  title: string;
  content: string;
  attachments?: QuestionAttachment[];
  author: { _ref: string }; // user._id
}

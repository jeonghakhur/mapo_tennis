export interface Attachment {
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface Post {
  _id: string;
  _type: 'post';
  title: string;
  content: string;
  author: string;
  category: 'notice' | 'event' | 'general' | 'tournament_schedule' | 'tournament_info';
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: Attachment[];
}

export interface PostInput {
  title: string;
  content: string;
  author: string;
  category: 'notice' | 'event' | 'general' | 'tournament_schedule' | 'tournament_info';
  isPublished?: boolean;
  publishedAt?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface PostAuthor {
  _id: string;
  _ref: string;
  name: string;
  // email?: string;
  // profileImage?: string;
}

export interface Post {
  _id: string;
  _type: 'post';
  title: string;
  content: string;
  author: PostAuthor | string;
  category: 'notice' | 'event' | 'general' | 'tournament_rules' | 'tournament_info';
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: Attachment[];
}

export interface PostInput {
  title: string;
  content: string;
  author: { _ref: string }; // user._id
  category: 'notice' | 'event' | 'general' | 'tournament_rules' | 'tournament_info';
  isPublished: boolean;
  attachments?: Attachment[];
  showOnMain?: boolean;
  mainPriority?: number;
}

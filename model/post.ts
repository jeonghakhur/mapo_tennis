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
  // 좋아요 관련 필드 추가
  likeCount?: number;
  likedBy?: string[]; // 좋아요를 누른 사용자 ID 배열
  // 코멘트 관련 필드 추가
  commentCount?: number;
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

// 좋아요 토글 응답 타입
export interface LikeToggleResponse {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
}

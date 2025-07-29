export interface CommentAuthor {
  _id: string;
  _ref: string;
  name: string;
}

export interface Comment {
  _id: string;
  _type: 'comment';
  content: string;
  author: CommentAuthor | string;
  post: string; // 포스트 ID
  createdAt: string;
  updatedAt?: string;
}

export interface CommentInput {
  content: string;
  author: { _ref: string }; // user._id
  post: string; // 포스트 ID
}

// 코멘트 생성/수정/삭제 응답 타입
export interface CommentResponse {
  success: boolean;
  comment?: Comment;
  comments?: Comment[];
  error?: string;
}

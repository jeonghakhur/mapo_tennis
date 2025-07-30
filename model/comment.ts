export interface CommentAuthor {
  _id: string;
  _ref: string;
  name: string;
}

export interface Comment {
  _id: string;
  _type: 'comment';
  content: string;
  author: CommentAuthor; // 확장된 author 정보
  post: { _ref: string }; // 참조 타입으로 통일
  createdAt: string;
  updatedAt?: string;
}

export interface CommentInput {
  content: string;
  author: { _ref: string }; // user._id
  post: { _ref: string }; // post._id (참조 타입)
}

// 코멘트 생성/수정/삭제 응답 타입
export interface CommentResponse {
  success: boolean;
  comment?: Comment;
  comments?: Comment[];
  error?: string;
}

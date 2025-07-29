import { client } from '@/sanity/lib/client';
import type { Comment, CommentInput } from '@/model/comment';

// 포스트의 코멘트 목록 조회
export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  return await client.fetch(
    `
    *[_type == "comment" && post == $postId]
    | order(createdAt desc){
      ...,
      author->{
        _id,
        name
      }
    }
  `,
    { postId },
  );
}

// 코멘트 생성
export async function createComment(data: CommentInput): Promise<Comment> {
  const comment = await client.create({
    _type: 'comment',
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 포스트의 코멘트 수 증가 (기존 필드가 없을 경우 0으로 초기화)
  await client.patch(data.post).setIfMissing({ commentCount: 0 }).inc({ commentCount: 1 }).commit();

  return comment as unknown as Comment;
}

// 코멘트 수정
export async function updateComment(
  id: string,
  updateFields: Partial<CommentInput>,
): Promise<Comment> {
  await client
    .patch(id)
    .set({
      ...updateFields,
      updatedAt: new Date().toISOString(),
    })
    .commit();

  // 업데이트 후 확장된 정보로 다시 조회
  return (await client.fetch(
    `
    *[_type == "comment" && _id == $id][0]{
      ...,
      author->{
        _id,
        name
      }
    }
  `,
    { id },
  )) as Comment;
}

// 코멘트 삭제
export async function deleteComment(id: string): Promise<void> {
  // 코멘트 정보 조회 (포스트 ID 확인용)
  const comment = await client.fetch(
    `
    *[_type == "comment" && _id == $id][0]{
      post
    }
  `,
    { id },
  );

  if (comment) {
    // 포스트의 코멘트 수 감소 (기존 필드가 없을 경우 0으로 초기화)
    await client
      .patch(comment.post)
      .setIfMissing({ commentCount: 0 })
      .dec({ commentCount: 1 })
      .commit();
  }

  // 코멘트 삭제
  await client.delete(id);
}

// 포스트의 코멘트 수 조회
export async function getCommentCount(postId: string): Promise<number> {
  const count = await client.fetch(
    `
    count(*[_type == "comment" && post == $postId])
  `,
    { postId },
  );

  return count || 0;
}

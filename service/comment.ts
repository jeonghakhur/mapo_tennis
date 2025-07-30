import { client } from '@/sanity/lib/client';
import type { Comment, CommentInput } from '@/model/comment';

// 포스트의 코멘트 목록 조회
export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  return await client.fetch(
    `
    *[_type == "comment" && post._ref == $postId]
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
  // 코멘트 생성과 포스트 업데이트를 병렬로 처리
  const [comment] = await Promise.all([
    client.create({
      _type: 'comment',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    // 포스트의 코멘트 수 증가 (기존 필드가 없을 경우 0으로 초기화)
    client
      .patch(data.post._ref)
      .setIfMissing({ commentCount: 0 })
      .inc({ commentCount: 1 })
      .commit(),
  ]);

  // 생성된 코멘트의 확장된 정보 조회
  const createdComment = await client.fetch(
    `
    *[_type == "comment" && _id == $id][0]{
      ...,
      author->{
        _id,
        name
      }
    }
  `,
    { id: comment._id },
  );

  return createdComment as Comment;
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
  // 코멘트 정보 조회와 삭제를 병렬로 처리
  const commentPromise = client.fetch(
    `
    *[_type == "comment" && _id == $id][0]{
      post
    }
  `,
    { id },
  );

  const comment = await commentPromise;

  if (comment && comment.post) {
    // 코멘트 삭제와 포스트 업데이트를 병렬로 처리
    await Promise.all([
      client.delete(id),
      client
        .patch(comment.post._ref || comment.post)
        .setIfMissing({ commentCount: 0 })
        .dec({ commentCount: 1 })
        .commit(),
    ]);
  } else {
    // 포스트 정보가 없으면 코멘트만 삭제
    await client.delete(id);
  }
}

// 포스트의 코멘트 수 조회
export async function getCommentCount(postId: string): Promise<number> {
  const count = await client.fetch(
    `
    count(*[_type == "comment" && post._ref == $postId])
  `,
    { postId },
  );

  return count || 0;
}

import { client } from '@/sanity/lib/client';
import type { Post, PostInput } from '@/model/post';
import { extractImageUrls, extractAssetIdFromUrl, isSanityAssetUrl } from '@/lib/markdownUtils';
import { deleteFromSanityAssets } from '@/lib/sanityAssets';

// 포스트 목록 조회 (발행된 것만)
export async function getPublishedPosts(): Promise<Post[]> {
  return await client.fetch(`
    *[_type == "post" && isPublished == true]
    | order(publishedAt desc){
      ...,
      author->{
          _id,
          name
        },
      "likeCount": coalesce(likeCount, 0),
      "likedBy": coalesce(likedBy, []),
      "commentCount": count(*[_type == "comment" && references(^._id)])
      }
  `);
}

// 포스트 목록 조회 (모든 것)
export async function getAllPosts(): Promise<Post[]> {
  return await client.fetch(`
    *[_type == "post"]
    | order(createdAt desc){
      ...,
      author->{
          _id,
          name
        },
      "likeCount": coalesce(likeCount, 0),
      "likedBy": coalesce(likedBy, []),
      "commentCount": count(*[_type == "comment" && references(^._id)])
      }
  `);
}

// 포스트 상세 조회
export async function getPost(id: string): Promise<Post | null> {
  if (!id) return null;
  return await client.fetch(
    `*[_type == "post" && _id == $id][0]{
      ...,
      author->{
          _id,
          name
        },
      "likeCount": coalesce(likeCount, 0),
      "likedBy": coalesce(likedBy, []),
      "commentCount": coalesce(commentCount, 0)
      }`,
    { id },
  );
}

// 카테고리별 포스트 조회
export async function getPostsByCategory(category: string): Promise<Post[]> {
  return await client.fetch(
    `*[_type == "post" && category == $category] | order(createdAt desc){
      ...,
      author->{
          _id,
          name
        },
      "likeCount": coalesce(likeCount, 0),
      "likedBy": coalesce(likedBy, []),
      "commentCount": coalesce(commentCount, 0)
      }`,
    {
      category,
    },
  );
}

// 포스트 생성
export async function createPost(data: PostInput): Promise<Post> {
  const post = await client.create({
    _type: 'post',
    ...data,
    likeCount: 0,
    likedBy: [],
    commentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return post as unknown as Post;
}

// 포스트 수정
export async function updatePost(id: string, updateFields: Partial<PostInput>): Promise<Post> {
  // 기존 포스트 정보 조회
  const existingPost = await getPost(id);

  if (existingPost) {
    const deletePromises: Promise<void>[] = [];

    // 첨부파일이 제거된 경우 파일 삭제
    if (existingPost.attachments && updateFields.attachments) {
      const removedAttachments = existingPost.attachments.filter(
        (existing) => !updateFields.attachments!.some((updated) => updated.url === existing.url),
      );

      // 병렬로 파일 삭제 처리
      for (const attachment of removedAttachments) {
        if (isSanityAssetUrl(attachment.url)) {
          const assetId = extractAssetIdFromUrl(attachment.url);
          if (assetId) {
            deletePromises.push(
              deleteFromSanityAssets(assetId).catch((error) => {
                console.error(`첨부파일 삭제 중 오류: ${attachment.filename}`, error);
              }),
            );
          }
        }
      }
    }

    // 마크다운 내용이 변경된 경우 이미지 처리
    if (
      existingPost.content &&
      updateFields.content &&
      existingPost.content !== updateFields.content
    ) {
      // 기존 마크다운에서 이미지 URL 추출
      const oldImageUrls = extractImageUrls(existingPost.content);
      // 새로운 마크다운에서 이미지 URL 추출
      const newImageUrls = extractImageUrls(updateFields.content);

      // 제거된 이미지 찾기
      const removedImages = oldImageUrls.filter((url) => !newImageUrls.includes(url));

      // 병렬로 이미지 삭제 처리
      for (const imageUrl of removedImages) {
        if (isSanityAssetUrl(imageUrl)) {
          const assetId = extractAssetIdFromUrl(imageUrl);
          if (assetId) {
            deletePromises.push(
              deleteFromSanityAssets(assetId).catch((error) => {
                console.error(`마크다운 이미지 삭제 중 오류: ${imageUrl}`, error);
              }),
            );
          }
        }
      }
    }

    // 파일 삭제를 병렬로 실행
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  }

  await client
    .patch(id)
    .set({
      ...updateFields,
      updatedAt: new Date().toISOString(),
    })
    .commit();

  // 업데이트된 포스트 정보를 직접 구성하여 추가 조회 방지
  const updatedPost = {
    ...existingPost,
    ...updateFields,
    updatedAt: new Date().toISOString(),
  };

  return updatedPost as Post;
}

// 포스트 삭제
export async function deletePost(id: string): Promise<void> {
  // 포스트 정보 조회
  const post = await getPost(id);

  if (post) {
    const deletePromises: Promise<void>[] = [];

    // 첨부파일 삭제
    if (post.attachments && post.attachments.length > 0) {
      for (const attachment of post.attachments) {
        if (isSanityAssetUrl(attachment.url)) {
          const assetId = extractAssetIdFromUrl(attachment.url);
          if (assetId) {
            deletePromises.push(
              deleteFromSanityAssets(assetId).catch((error) => {
                console.error(`첨부파일 삭제 중 오류: ${attachment.filename}`, error);
              }),
            );
          }
        }
      }
    }

    // 마크다운 내용에서 이미지 URL 추출 및 삭제
    if (post.content) {
      const imageUrls = extractImageUrls(post.content);
      for (const imageUrl of imageUrls) {
        if (isSanityAssetUrl(imageUrl)) {
          const assetId = extractAssetIdFromUrl(imageUrl);
          if (assetId) {
            deletePromises.push(
              deleteFromSanityAssets(assetId).catch((error) => {
                console.error(`마크다운 이미지 삭제 중 오류: ${imageUrl}`, error);
              }),
            );
          }
        }
      }
    }

    // 파일 삭제를 병렬로 실행
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  }

  // 포스트 삭제
  await client.delete(id);
}

// 포스트 발행
export async function publishPost(id: string): Promise<Post> {
  await client
    .patch(id)
    .set({
      isPublished: true,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .commit();

  return (await getPost(id)) as Post;
}

// 포스트 임시저장 (발행 취소)
export async function unpublishPost(id: string): Promise<Post> {
  await client
    .patch(id)
    .set({
      isPublished: false,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .commit();

  return (await getPost(id)) as Post;
}

// 메인에 노출할 포스트 조회 (mainPriority가 1 이상인 것만, 오름차순)
export async function getMainPosts(): Promise<Post[]> {
  return await client.fetch(`
    *[_type == "post" && isPublished == true && defined(mainPriority) && mainPriority >= 1]
    | order(mainPriority asc, publishedAt desc){
      ...,
      author->{
        _id,
        name
      },
      "likeCount": coalesce(likeCount, 0),
      "likedBy": coalesce(likedBy, []),
      "commentCount": coalesce(commentCount, 0)
    }
  `);
}

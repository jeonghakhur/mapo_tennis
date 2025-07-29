import { Button, Text, Flex } from '@radix-ui/themes';
import { Heart } from 'lucide-react';
import { usePostLike } from '@/hooks/usePostLike';
import { useSession } from 'next-auth/react';

interface PostLikeButtonProps {
  postId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
}

export default function PostLikeButton({
  postId,
  initialLikeCount = 0,
  initialIsLiked = false,
}: PostLikeButtonProps) {
  const { data: session } = useSession();
  const { likeCount, isLiked, isLoading, toggleLike } = usePostLike({
    postId,
    initialLikeCount,
    initialIsLiked,
  });

  const handleLikeClick = () => {
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      return;
    }
    // 로딩 중이면 중복 클릭 방지
    if (isLoading) return;
    toggleLike();
  };

  return (
    <Flex align="center" gap="2">
      <Button
        size="2"
        variant="ghost"
        onClick={handleLikeClick}
        disabled={isLoading}
        style={{
          padding: '8px',
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Heart
          size={20}
          fill={isLiked ? '#ef4444' : 'transparent'}
          color={isLiked ? '#ef4444' : isLoading ? '#9ca3af' : '#6b7280'}
          style={{
            transition: 'all 0.2s ease',
            transform: isLiked ? 'scale(1.1)' : 'scale(1)',
            opacity: isLoading ? 0.7 : 1,
          }}
        />
      </Button>
      {likeCount > 0 && (
        <Text size="2" color="gray">
          {likeCount}
        </Text>
      )}
    </Flex>
  );
}

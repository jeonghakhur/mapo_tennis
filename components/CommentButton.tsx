import { Button, Text, Flex } from '@radix-ui/themes';
import { MessageCircle } from 'lucide-react';

interface CommentButtonProps {
  commentCount: number;
  onClick: () => void;
  isLoading?: boolean;
}

export default function CommentButton({
  commentCount,
  onClick,
  isLoading = false,
}: CommentButtonProps) {
  return (
    <Flex align="center" gap="2">
      <Button
        size="2"
        variant="ghost"
        onClick={onClick}
        disabled={isLoading}
        style={{
          padding: '8px',
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <MessageCircle
          size={20}
          color={isLoading ? '#9ca3af' : '#6b7280'}
          style={{
            transition: 'all 0.2s ease',
          }}
        />
      </Button>
      {commentCount > 0 && (
        <Text size="2" color="gray">
          {commentCount}
        </Text>
      )}
    </Flex>
  );
}

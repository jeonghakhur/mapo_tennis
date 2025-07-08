'use client';
import { Card, Box, Flex } from '@radix-ui/themes';

export default function SkeletonCard() {
  return (
    <Card
      style={{
        width: 380,
        padding: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        background: '#fff',
      }}
    >
      <Box mb="4" height="32px" style={{ background: '#eee', borderRadius: 8 }} />
      <Box mb="5" height="20px" style={{ background: '#f0f0f0', borderRadius: 8 }} />
      <Box mb="4">
        <Flex direction="column" gap="3">
          {[...Array(5)].map((_, i) => (
            <Box key={i} height="40px" style={{ background: '#f5f5f5', borderRadius: 8 }} />
          ))}
        </Flex>
      </Box>
      <Box height="48px" style={{ background: '#eee', borderRadius: 8 }} />
    </Card>
  );
}

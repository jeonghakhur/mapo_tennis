import { Card, Box, Text } from '@radix-ui/themes';

export default function ClubPage() {
  return (
    <Box
      style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card style={{ width: 340, padding: 32, background: '#fff' }}>
        <Text size="5" weight="bold" align="center" mb="4" style={{ color: '#222' }}>
          클럽
        </Text>
        <Text size="3" align="center" color="gray">
          클럽 관련 기능이 이곳에 추가될 예정입니다.
        </Text>
      </Card>
    </Box>
  );
}

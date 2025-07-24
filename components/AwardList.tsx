'use client';
import { Award } from '@/model/award';
import { Button, Card, Flex, Badge } from '@radix-ui/themes';
import { Edit, Trash2 } from 'lucide-react';

interface AwardListProps {
  awards: Award[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  canManage?: boolean;
}

export default function AwardList({
  awards,
  onEdit,
  onDelete,
  isLoading,
  canManage = false,
}: AwardListProps) {
  const getAwardCategoryLabel = (category: string) => {
    switch (category) {
      case '우승':
        return { label: '우승', color: 'gold' as const };
      case '준우승':
        return { label: '준우승', color: 'gray' as const };
      case '3위':
        return { label: '3위', color: 'bronze' as const };
      case '공동3위':
        return { label: '공동3위', color: 'bronze' as const };
      default:
        return { label: category, color: 'gray' as const };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // awards가 배열이 아닌 경우 빈 배열로 처리
  const safeAwards = Array.isArray(awards) ? awards : [];

  if (safeAwards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">등록된 수상 결과가 없습니다.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {safeAwards.map((award) => {
        const categoryInfo = getAwardCategoryLabel(award.awardCategory);

        return (
          <Card key={award._id} className="p-4">
            <Flex justify="between" align="start">
              <div className="flex-1">
                <Flex align="center" gap="2" mb="2">
                  <h3 className="font-semibold text-lg">
                    {award.competition} ({award.year})
                  </h3>
                  <Badge color={categoryInfo.color} variant="solid">
                    {categoryInfo.label}
                  </Badge>
                </Flex>

                <Flex gap="2">
                  <p>
                    <strong>부서:</strong> {award.division}
                  </p>
                  <p>
                    <strong>클럽:</strong> {award.club}
                  </p>
                  <p>
                    <strong>선수:</strong> {award.players.join(', ')}
                  </p>
                </Flex>
              </div>

              {canManage && (
                <Flex gap="2">
                  <Button size="2" variant="soft" onClick={() => onEdit(award._id)}>
                    <Edit size={16} />
                    수정
                  </Button>
                  <Button size="2" variant="soft" color="red" onClick={() => onDelete(award._id)}>
                    <Trash2 size={16} />
                    삭제
                  </Button>
                </Flex>
              )}
            </Flex>
          </Card>
        );
      })}
    </div>
  );
}

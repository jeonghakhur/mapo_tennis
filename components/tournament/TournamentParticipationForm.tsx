import { Flex, Text, Switch, Select } from '@radix-ui/themes';
import { Combobox } from '@/components/ui/combobox';
import type { TournamentParticipationFormProps } from '@/types/tournament';

export function TournamentParticipationForm({
  availableDivisions,
  division,
  setDivision,
  memo,
  setMemo,
  isFeePaid,
  setIsFeePaid,
  divisionRef,
  isIndividual,
}: TournamentParticipationFormProps) {
  const teamOrder = [
    '가',
    '나',
    '다',
    '라',
    '마',
    '바',
    '사',
    '아',
    '자',
    '차',
    '카',
    '타',
    '파',
    '하',
  ];
  return (
    <div className="table-form">
      <h2 className="text-lg font-bold mt-8 mb-2">대회 참석 정보</h2>
      <table>
        <tbody>
          <tr>
            <th style={{ width: '100px' }}>참가부서 *</th>
            <td>
              <div ref={divisionRef}>
                <Combobox
                  options={availableDivisions.filter(Boolean).map((div) => ({
                    value: div?.value || '',
                    label: div?.label || '',
                  }))}
                  value={division}
                  onValueChange={setDivision}
                  placeholder="참가부서를 선택하세요"
                  searchPlaceholder="부서 검색..."
                  emptyMessage="찾는 부서가 없습니다."
                />
              </div>
            </td>
          </tr>

          {!isIndividual && (
            <tr>
              <th>참가팀순서</th>
              <td>
                <Select.Root value={memo} onValueChange={setMemo} size="3">
                  <Select.Trigger placeholder="참가팀이 여러팀인 경우 순서를 지정해주세요" />
                  <Select.Content>
                    <Select.Item value="none">선택안함</Select.Item>
                    {teamOrder.map((order) => (
                      <Select.Item key={order} value={order}>
                        {order}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </td>
            </tr>
          )}
          <tr>
            <th>참가비 납부</th>
            <td>
              <Flex align="center" gap="3">
                <Switch
                  id="fee-paid-switch"
                  checked={isFeePaid}
                  onCheckedChange={setIsFeePaid}
                  size="3"
                  aria-label="참가비 납부 상태"
                  tabIndex={0}
                />
                <label htmlFor="fee-paid-switch" className="cursor-pointer">
                  <Text size="3" color={isFeePaid ? 'green' : 'gray'}>
                    {isFeePaid ? '납부 완료' : '미납'}
                  </Text>
                </label>
              </Flex>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

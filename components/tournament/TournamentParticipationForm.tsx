import { TextField, Flex, Text, Switch } from '@radix-ui/themes';
import { Combobox } from '@/components/ui/combobox';
import type { TournamentParticipationFormProps } from '@/types/tournament';

export function TournamentParticipationForm({
  availableDivisions,
  division,
  setDivision,
  contact,
  setContact,
  email,
  setEmail,
  memo,
  setMemo,
  isFeePaid,
  setIsFeePaid,
  divisionRef,
  contactRef,
}: TournamentParticipationFormProps) {
  return (
    <>
      <h2 className="text-lg font-bold mt-8">대회 참석 정보</h2>
      <table className="table-form">
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
          <tr>
            <th>연락처 *</th>
            <td>
              <TextField.Root
                size="3"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="연락처를 입력하세요"
                ref={contactRef}
              />
            </td>
          </tr>
          <tr>
            <th>이메일</th>
            <td>
              <TextField.Root
                size="3"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
              />
            </td>
          </tr>
          <tr>
            <th>메모</th>
            <td>
              <TextField.Root
                size="3"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="추가 사항을 입력하세요"
              />
            </td>
          </tr>
          <tr>
            <th>참가비 납부</th>
            <td>
              <Flex align="center" gap="3">
                <Switch checked={isFeePaid} onCheckedChange={setIsFeePaid} size="3" />
                <Text size="3" color={isFeePaid ? 'green' : 'gray'}>
                  {isFeePaid ? '납부 완료' : '미납'}
                </Text>
              </Flex>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

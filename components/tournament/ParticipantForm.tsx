import { TextField, Text } from '@radix-ui/themes';
import { Combobox } from '@/components/ui/combobox';
import type { ParticipantFormProps } from '@/types/tournament';

export function ParticipantForm({
  label,
  participant,
  clubs,
  isSharedClub = false,
  sharedClubId = '',
  isIndividual = true,
}: ParticipantFormProps) {
  return (
    <div className="table-form">
      <div className="font-bold text-lg mb-2">{label}</div>
      <table>
        <tbody>
          {isIndividual && (
            <tr>
              <th>클럽 *</th>
              <td>
                <div ref={participant.clubRef}>
                  <Combobox
                    options={clubs
                      .filter((club) => club._id)
                      .map((club) => ({
                        value: club._id!,
                        label: club.name,
                      }))}
                    value={isSharedClub ? sharedClubId : participant.clubId}
                    onValueChange={isSharedClub ? () => {} : participant.setClubId}
                    placeholder="클럽 선택"
                    searchPlaceholder="클럽 검색..."
                    emptyMessage="찾는 클럽이 없습니다."
                    disabled={isSharedClub}
                    aria-label="클럽 선택"
                  />
                </div>
              </td>
            </tr>
          )}
          <tr>
            <th style={{ width: '100px' }}>이름 *</th>
            <td>
              <TextField.Root
                size="3"
                value={participant.name}
                onChange={(e) => participant.setName(e.target.value)}
                onBlur={participant.handleNameBlur}
                placeholder="참가자 이름"
                ref={participant.nameRef}
              />
            </td>
          </tr>
          <tr>
            <th>생년월일 *</th>
            <td>
              <TextField.Root
                size="3"
                value={participant.birth}
                onChange={(e) => participant.setBirth(e.target.value)}
                placeholder="예: 1990"
                ref={participant.birthRef}
              />
            </td>
          </tr>
          <tr>
            <th>점수 *</th>
            <td>
              <TextField.Root
                size="3"
                value={participant.score}
                onChange={(e) => participant.setScore(e.target.value)}
                placeholder="0-10"
                ref={participant.scoreRef}
              />
            </td>
          </tr>
        </tbody>
      </table>
      {/* 등록 회원 여부 표시 */}
      {participant.isRegistered !== null &&
        participant.name &&
        participant.clubId &&
        participant.name.trim() !== '' && (
          <div
            className={`p-2 border rounded text-sm mt-2  ${
              participant.isRegistered
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <Text color={participant.isRegistered ? 'green' : 'orange'} as="p" className="keep-all">
              {participant.isRegistered
                ? '등록된 클럽 회원입니다.'
                : '등록되지 않은 회원입니다. 생년월일과 점수를 직접 입력해주세요.'}
            </Text>
          </div>
        )}
    </div>
  );
}

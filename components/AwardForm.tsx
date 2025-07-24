'use client';
import { useState, useEffect, useRef } from 'react';
import { Button, TextField, Flex, Select, Box } from '@radix-ui/themes';
import { Award, AwardInput } from '@/model/award';
import ConfirmDialog from '@/components/ConfirmDialog';

interface AwardFormProps {
  award?: Award | null;
  onSubmit: (data: AwardInput) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  submitText?: string;
}

export default function AwardForm({
  award,
  onSubmit,
  loading = false,
  disabled = false,
  submitText = '수상 결과 등록',
}: AwardFormProps) {
  const [competition, setCompetition] = useState('');
  const [year, setYear] = useState('');
  const [division, setDivision] = useState('');
  const [awardCategory, setAwardCategory] = useState<'우승' | '준우승' | '3위' | '공동3위'>('우승');
  const [club, setClub] = useState('');
  const [order, setOrder] = useState('');
  const [players, setPlayers] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [focusMoveFn, setFocusMoveFn] = useState<(() => void) | null>(null);

  const competitionRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const divisionRef = useRef<HTMLInputElement>(null);
  const clubRef = useRef<HTMLInputElement>(null);
  const orderRef = useRef<HTMLInputElement>(null);

  // 최초 마운트 시에만 상태 초기화
  useEffect(() => {
    if (award) {
      setCompetition(award.competition);
      setYear(String(award.year));
      setDivision(award.division);
      setAwardCategory(award.awardCategory);
      setClub(award.club);
      setOrder(String(award.order));
      setPlayers(award.players.length > 0 ? award.players : ['']);
    } else {
      setYear(String(new Date().getFullYear()));
      setOrder('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모든 필수 항목이 완료되었는지 확인하는 함수
  const isFormComplete = () => {
    return !!(competition && year && division && club && order && players.some((p) => p.trim()));
  };

  const addPlayer = () => {
    setPlayers([...players, '']);
  };

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!competition) {
      setError('대회명을 입력해 주세요.');
      setFocusMoveFn(() => () => competitionRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!year) {
      setError('년도를 입력해 주세요.');
      setFocusMoveFn(() => () => yearRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!/^\d{4}$/.test(year)) {
      setError('년도는 4자리(YYYY)로 입력해 주세요.');
      setFocusMoveFn(() => () => yearRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (Number(year) < 2000 || Number(year) > 2100) {
      setError('년도는 2000년부터 2100년 사이로 입력해 주세요.');
      setFocusMoveFn(() => () => yearRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!division) {
      setError('부서구분을 입력해 주세요.');
      setFocusMoveFn(() => () => divisionRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!club) {
      setError('클럽명을 입력해 주세요.');
      setFocusMoveFn(() => () => clubRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!order) {
      setError('정렬순서를 입력해 주세요.');
      setFocusMoveFn(() => () => orderRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (Number(order) < 1) {
      setError('정렬순서는 1 이상으로 입력해 주세요.');
      setFocusMoveFn(() => () => orderRef.current?.focus());
      setErrorDialogOpen(true);
      return;
    }
    if (!players.some((p) => p.trim())) {
      setError('최소 1명의 선수를 입력해 주세요.');
      setFocusMoveFn(null);
      setErrorDialogOpen(true);
      return;
    }

    setFocusMoveFn(null);
    await onSubmit({
      competition,
      year: Number(year),
      division,
      awardCategory,
      players: players.filter((p) => p.trim()),
      club,
      order: Number(order),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="table-form">
        <table>
          <tbody>
            <tr>
              <th>대회명</th>
              <td>
                <TextField.Root
                  ref={competitionRef}
                  placeholder="예: 제36회 마포구협회장배 단체전"
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>년도</th>
              <td>
                <TextField.Root
                  ref={yearRef}
                  placeholder="2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>부서구분</th>
              <td>
                <TextField.Root
                  ref={divisionRef}
                  placeholder="예: 마스터부, 챌린저부, 퓨처스부, 국화부, 개나리부"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>수상구분</th>
              <td>
                <Select.Root
                  size="3"
                  value={awardCategory}
                  onValueChange={(value) => {
                    if (!value) return;
                    if (value) {
                      setAwardCategory(value as '우승' | '준우승' | '3위' | '공동3위');
                    }
                  }}
                >
                  <Select.Trigger placeholder="수상구분을 선택하세요" style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="우승">우승</Select.Item>
                    <Select.Item value="준우승">준우승</Select.Item>
                    <Select.Item value="3위">3위</Select.Item>
                    <Select.Item value="공동3위">공동3위</Select.Item>
                  </Select.Content>
                </Select.Root>
              </td>
            </tr>
            <tr>
              <th>클럽명</th>
              <td>
                <TextField.Root
                  ref={clubRef}
                  placeholder="예: 청우회(가), 목요라이트"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>정렬순서</th>
              <td>
                <TextField.Root
                  ref={orderRef}
                  placeholder="1"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  size="3"
                  radius="large"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <th>선수명</th>
              <td>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <Flex key={index} gap="2" align="center">
                      <TextField.Root
                        value={player}
                        onChange={(e) => updatePlayer(index, e.target.value)}
                        placeholder={`선수 ${index + 1} 이름`}
                        size="3"
                        radius="large"
                        style={{ flex: 1 }}
                      />
                      {players.length > 1 && (
                        <Button
                          type="button"
                          variant="soft"
                          color="red"
                          size="2"
                          onClick={() => removePlayer(index)}
                        >
                          삭제
                        </Button>
                      )}
                    </Flex>
                  ))}
                  <Button
                    type="button"
                    variant="soft"
                    size="2"
                    onClick={addPlayer}
                    style={{ marginTop: '8px' }}
                  >
                    선수 추가
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {errorDialogOpen && (
        <ConfirmDialog
          title="입력 오류"
          description={error}
          confirmText="확인"
          confirmColor="red"
          open={errorDialogOpen}
          onOpenChange={setErrorDialogOpen}
          onConfirm={() => {
            setErrorDialogOpen(false);
            if (focusMoveFn) {
              setTimeout(() => focusMoveFn(), 0);
              setFocusMoveFn(null);
            }
          }}
        />
      )}

      <Box className="btn-wrap" mt="4">
        <Button
          type="submit"
          size="3"
          disabled={!isFormComplete() || disabled || loading}
          style={{
            opacity: isFormComplete() ? 1 : 0.5,
            cursor: isFormComplete() ? 'pointer' : 'not-allowed',
          }}
        >
          {submitText}
        </Button>
      </Box>
    </form>
  );
}

// components/SummaryTable.tsx
import React from 'react';
import { Award } from '@/model/award';

function groupAwards(awards: Award[]) {
  const grouped: Record<
    string,
    Record<string, Record<string, { players: string[]; club: string }[]>>
  > = {};
  awards.forEach((award) => {
    const compYear = `${award.competition}||${award.year}`;
    if (!grouped[compYear]) grouped[compYear] = {};
    if (!grouped[compYear][award.division]) grouped[compYear][award.division] = {};
    if (!grouped[compYear][award.division][award.awardCategory])
      grouped[compYear][award.division][award.awardCategory] = [];
    grouped[compYear][award.division][award.awardCategory].push({
      players: award.players,
      club: award.club,
    });
  });
  return grouped;
}

function getRowSpanForDivision(divisionObj: Record<string, { players: string[]; club: string }[]>) {
  return Object.values(divisionObj).reduce((sum, arr) => sum + arr.length, 0);
}

function SummaryTable({ awards }: { awards: Award[] }) {
  const grouped = groupAwards(awards);

  return (
    <div className="overflow-x-auto">
      {Object.entries(grouped).map(([compYear, divisions]) => {
        const [competition, year] = compYear.split('||');
        return (
          <table key={compYear} className="min-w-full border mb-8 bg-white">
            <thead>
              <tr>
                <th className="border px-2 py-1">대회명</th>
                <th className="border px-2 py-1">일자</th>
                <th className="border px-2 py-1">부서구분</th>
                <th className="border px-2 py-1">수상구분</th>
                <th className="border px-2 py-1">선수명</th>
                <th className="border px-2 py-1">클럽명</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(divisions).map(([division, categories], i) => {
                const divisionRowSpan = getRowSpanForDivision(categories);
                let divisionRendered = false;
                return Object.entries(categories).map(([awardCategory, items], j) => {
                  let awardCategoryRendered = false;
                  return items.map((item, k) => {
                    const renderDivision = !divisionRendered;
                    const renderAwardCategory = !awardCategoryRendered;
                    divisionRendered = true;
                    awardCategoryRendered = true;
                    return (
                      <tr key={`${division}-${awardCategory}-${k}`}>
                        {i === 0 && j === 0 && k === 0 && (
                          <>
                            <td
                              className="border px-2 py-1"
                              rowSpan={Object.values(divisions).reduce(
                                (sum, cats) => sum + getRowSpanForDivision(cats),
                                0,
                              )}
                            >
                              {competition}
                            </td>
                            <td
                              className="border px-2 py-1"
                              rowSpan={Object.values(divisions).reduce(
                                (sum, cats) => sum + getRowSpanForDivision(cats),
                                0,
                              )}
                            >
                              {year}
                            </td>
                          </>
                        )}
                        {renderDivision && (
                          <td className="border px-2 py-1" rowSpan={divisionRowSpan}>
                            {division}
                          </td>
                        )}
                        {renderAwardCategory && (
                          <td className="border px-2 py-1" rowSpan={items.length}>
                            {awardCategory === 'winner'
                              ? '우승'
                              : awardCategory === 'runner-up'
                                ? '준우승'
                                : awardCategory === 'third'
                                  ? '3위'
                                  : awardCategory === 'joint-third'
                                    ? '공동3위'
                                    : awardCategory}
                          </td>
                        )}
                        <td className="border px-2 py-1">{item.players.join(', ')}</td>
                        <td className="border px-2 py-1">{item.club}</td>
                      </tr>
                    );
                  });
                });
              })}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}

export default SummaryTable;

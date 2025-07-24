import { client } from '../sanity/lib/client';
import { Award, AwardInput } from '../model/award';

export const awardService = {
  // 모든 수상 결과 조회
  async getAllAwards(): Promise<Award[]> {
    const query = `*[_type == "award"] | order(year desc, competition asc, division asc, 
      select(
        awardCategory == "winner" => 1,
        awardCategory == "runner-up" => 2,
        awardCategory == "third" => 3,
        4
      ) asc, order asc) {
      _id,
      _type,
      competition,
      year,
      division,
      awardCategory,
      players,
      club,
      order,
      gameType,
      _createdAt,
      _updatedAt,
      _rev
    }`;

    return await client.fetch(query);
  },

  // 특정 대회의 수상 결과 조회
  async getAwardsByCompetition(competition: string, year: number): Promise<Award[]> {
    const query = `*[_type == "award" && competition == $competition && year == $year] | order(division asc, 
      select(
        awardCategory == "winner" => 1,
        awardCategory == "runner-up" => 2,
        awardCategory == "third" => 3,
        4
      ) asc, order asc) {
      _id,
      _type,
      competition,
      year,
      division,
      awardCategory,
      players,
      club,
      order,
      gameType,
      _createdAt,
      _updatedAt,
      _rev
    }`;

    return await client.fetch(query, { competition, year });
  },

  // 특정 부서의 수상 결과 조회
  async getAwardsByDivision(division: string): Promise<Award[]> {
    const query = `*[_type == "award" && division == $division] | order(year desc, competition asc, 
      select(
        awardCategory == "winner" => 1,
        awardCategory == "runner-up" => 2,
        awardCategory == "third" => 3,
        4
      ) asc, order asc) {
      _id,
      _type,
      competition,
      year,
      division,
      awardCategory,
      players,
      club,
      order,
      gameType,
      _createdAt,
      _updatedAt,
      _rev
    }`;

    return await client.fetch(query, { division });
  },

  // 개별 수상 결과 조회
  async getAwardById(id: string): Promise<Award | null> {
    const query = `*[_type == "award" && _id == $id][0] {
      _id,
      _type,
      competition,
      year,
      division,
      awardCategory,
      players,
      club,
      order,
      gameType,
      _createdAt,
      _updatedAt,
      _rev
    }`;

    return await client.fetch(query, { id });
  },

  // 수상 결과 생성
  async createAward(award: AwardInput): Promise<Award> {
    return await client.create({
      _type: 'award',
      ...award,
    });
  },

  // 수상 결과 수정
  async updateAward(id: string, award: Partial<AwardInput>): Promise<Award> {
    return await client.patch(id).set(award).commit();
  },

  // 수상 결과 삭제
  async deleteAward(id: string): Promise<void> {
    await client.delete(id);
  },

  // 전체 수상 결과 삭제 (배치 처리)
  async deleteAllAwards(): Promise<void> {
    const ids: string[] = await client.fetch(`*[_type == "award"]._id`);
    const BATCH_SIZE = 5;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((id) => client.delete(id)));
      // 필요시 약간의 딜레이 추가 (rate limit이 계속 발생하면 아래 주석 해제)
      // await new Promise(res => setTimeout(res, 200));
    }
  },

  // 대회별 수상 결과 통계
  async getAwardStats(): Promise<{
    totalAwards: number;
    competitions: string[];
    years: number[];
    divisions: string[];
  }> {
    const query = `{
      "totalAwards": count(*[_type == "award"]),
      "competitions": array::distinct(*[_type == "award"].competition),
      "years": array::distinct(*[_type == "award"].year),
      "divisions": array::distinct(*[_type == "award"].division)
    }`;

    return await client.fetch(query);
  },
};

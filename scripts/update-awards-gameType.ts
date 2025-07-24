'use strict';
import { client } from '../sanity/lib/client';

async function migrateAwardsGameType() {
  const awards = await client.fetch('*[_type == "award"]{_id, competition}');
  for (const award of awards) {
    let gameType = '단체전';
    if (award.competition.includes('개인전')) gameType = '개인전';
    else if (award.competition.includes('단체전')) gameType = '단체전';
    // 이미 값이 올바르면 패스
    const existing = await client.fetch('*[_type == "award" && _id == $id][0]{gameType}', {
      id: award._id,
    });
    if (existing && existing.gameType === gameType) continue;
    await client.patch(award._id).set({ gameType }).commit();
    console.log(`Updated ${award._id} (${award.competition}) → ${gameType}`);
  }
  console.log('Migration complete!');
}

migrateAwardsGameType().catch(console.error);

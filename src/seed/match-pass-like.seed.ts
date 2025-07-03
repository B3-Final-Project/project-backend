import { BoosterAction } from '../modules/booster/enums/action.enum';
import { DataSource } from 'typeorm';
import { Profile } from '../common/entities/profile.entity';
import { UserMatches } from '../common/entities/user-matches.entity';

export async function seedMatchesPassesLikes(
  dataSource: DataSource,
  count: number = 100,
) {
  const matchesRepo = dataSource.getRepository(UserMatches);
  const profileRepo = dataSource.getRepository(Profile);

  const profiles = await profileRepo.find();
  if (profiles.length < 2) {
    console.log('⚠️ Not enough profiles to seed matches, passes, and likes.');
    return;
  }

  const actions = [BoosterAction.MATCH, BoosterAction.LIKE, BoosterAction.SEEN];
  const stats = { MATCH: 0, LIKE: 0, SEEN: 0 };
  const records: UserMatches[] = [];

  for (let i = 0; i < count; i++) {
    const fromIdx = Math.floor(Math.random() * profiles.length);
    let toIdx = Math.floor(Math.random() * profiles.length);
    while (toIdx === fromIdx) {
      toIdx = Math.floor(Math.random() * profiles.length);
    }
    const action = actions[Math.floor(Math.random() * actions.length)];
    stats[BoosterAction[action]]++;
    records.push(
      matchesRepo.create({
        from_profile_id: profiles[fromIdx].id,
        to_profile_id: profiles[toIdx].id,
        action,
        created_at: new Date(
          Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        ),
      }),
    );
  }

  await matchesRepo.save(records);
  console.log(`✅ Seeded ${count} user-matches records`);
  console.log('📊 Match/Like/Seen stats:', stats);
}

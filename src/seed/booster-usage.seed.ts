import { BoosterPack } from '../common/entities/booster.entity';
import { BoosterUsage } from '../common/entities/booster-usage.entity';
import { DataSource } from 'typeorm';
import { User } from '../common/entities/user.entity';

export async function seedBoosterUsage(
  dataSource: DataSource,
  count: number = 50,
) {
  const boosterUsageRepository = dataSource.getRepository(BoosterUsage);
  const userRepository = dataSource.getRepository(User);
  const boosterPackRepository = dataSource.getRepository(BoosterPack);

  // Get all users and booster packs
  const users = await userRepository.find();
  const boosterPacks = await boosterPackRepository.find();

  if (users.length === 0 || boosterPacks.length === 0) {
    console.log(
      '⚠️ No users or booster packs found, skipping booster usage seeding',
    );
    return;
  }

  const boosterUsages: BoosterUsage[] = [];

  let earliestDate = new Date();
  let latestDate = new Date(0);
  const userUsageCount: Record<string, number> = {};
  const boosterPackUsageCount: Record<string, number> = {};

  for (let i = 0; i < count; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]; //NOSONAR
    const randomBoosterPack =
      boosterPacks[Math.floor(Math.random() * boosterPacks.length)]; //NOSONAR

    const usedAt = new Date(
      Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), //NOSONAR Random date within last 30 days
    );

    if (usedAt < earliestDate) earliestDate = usedAt;
    if (usedAt > latestDate) latestDate = usedAt;

    userUsageCount[randomUser.user_id] =
      (userUsageCount[randomUser.user_id] || 0) + 1;
    boosterPackUsageCount[randomBoosterPack.id] =
      (boosterPackUsageCount[randomBoosterPack.id] || 0) + 1;

    const boosterUsage = boosterUsageRepository.create({
      userId: randomUser.user_id,
      boosterPackId: randomBoosterPack.id,
      usedAt,
    });

    boosterUsages.push(boosterUsage);
  }

  await boosterUsageRepository.save(boosterUsages);
  // Statistics
  const uniqueUsers = Object.keys(userUsageCount).length;
  const uniqueBoosterPacks = Object.keys(boosterPackUsageCount).length;
  const mostActiveUser = Object.entries(userUsageCount).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const mostUsedBoosterPack = Object.entries(boosterPackUsageCount).sort(
    (a, b) => b[1] - a[1],
  )[0];

  console.log(`✅ Seeded ${count} booster usage records`);
  console.log(`📊 Booster Usage Statistics:`);
  console.log(`- Unique users: ${uniqueUsers}`);
  console.log(`- Unique booster packs: ${uniqueBoosterPacks}`);
  console.log(
    `- Most active user: ${mostActiveUser ? mostActiveUser[0] + ' (' + mostActiveUser[1] + ' usages)' : 'N/A'}`,
  );
  console.log(
    `- Most used booster pack: ${mostUsedBoosterPack ? mostUsedBoosterPack[0] + ' (' + mostUsedBoosterPack[1] + ' usages)' : 'N/A'}`,
  );
  console.log(`- Earliest usage date: ${earliestDate.toISOString()}`);
  console.log(`- Latest usage date: ${latestDate.toISOString()}`);
}

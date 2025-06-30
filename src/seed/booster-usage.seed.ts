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

  for (let i = 0; i < count; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]; //NOSONAR
    const randomBoosterPack =
      boosterPacks[Math.floor(Math.random() * boosterPacks.length)]; //NOSONAR

    const boosterUsage = boosterUsageRepository.create({
      userId: randomUser.id,
      boosterPackId: randomBoosterPack.id,
      usedAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), //NOSONAR Random date within last 30 days
      ),
    });

    boosterUsages.push(boosterUsage);
  }

  await boosterUsageRepository.save(boosterUsages);
  console.log(`✅ Seeded ${count} booster usage records`);
}

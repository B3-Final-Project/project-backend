import { DataSource } from 'typeorm';
import { ormConfig } from '../app.module';
import { seedBoosterUsage } from './booster-usage.seed';
import { seedMatchesPassesLikes } from './match-pass-like.seed';
import { seedUsersAndInterests } from './user.seed';

export class Seed {
  public async main() {
    const ds = new DataSource(ormConfig);
    await ds.initialize();

    // Seed users and interests
    await seedUsersAndInterests(ds, 1000);

    // Seed matches, passes, and likes
    await seedMatchesPassesLikes(ds, 2000);

    // Seed booster usage data
    await seedBoosterUsage(ds, 1500);

    await ds.destroy();
    console.log('✅ All seeds completed successfully');
  }
}

// Execute the seed if this file is run directly
if (require.main === module) {
  const seed = new Seed();
  seed.main().catch(console.error);
}

import { DataSource } from 'typeorm';
import { ormConfig } from '../app.module';
import { seedUsersAndInterests } from './user.seed';

export class Seed {
  public async main() {
    const ds = new DataSource(ormConfig);
    await ds.initialize();

    // Seed users and interests
    await seedUsersAndInterests(ds, 100);

    await ds.destroy();
    console.log('✅ All seeds completed successfully');
  }
}

// Execute the seed if this file is run directly
if (require.main === module) {
  const seed = new Seed();
  seed.main().catch(console.error);
}

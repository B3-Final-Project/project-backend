import { DataSource } from 'typeorm';
import { ormConfig } from '../app.module';
import { BoosterRepository } from '../common/repository/booster.repository';
import { BoosterPack } from '../common/entities/booster.entity';
import { BoosterSeed } from './booster.seed';

export class Seed {
  public async main() {
    const ds = new DataSource(ormConfig);
    await ds.initialize();

    // Seed boosters
    const boosterRepository = new BoosterRepository(
      ds.getRepository(BoosterPack),
    );
    const boosterSeed = new BoosterSeed(boosterRepository);
    await boosterSeed.seed();

    await ds.destroy();
    console.log('✅ All seeds completed successfully');
  }
}

// Execute the seed if this file is run directly
if (require.main === module) {
  const seed = new Seed();
  seed.main().catch(console.error);
}

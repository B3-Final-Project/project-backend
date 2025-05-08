import { DataSource } from 'typeorm';
import { seedUsersAndInterests } from './user.seed';
import { ormConfig } from '../app.module';

async function main() {
  const ds = new DataSource(ormConfig);
  await ds.initialize();
  await seedUsersAndInterests(ds, 100);
  await ds.destroy();
}

main().catch(console.error);

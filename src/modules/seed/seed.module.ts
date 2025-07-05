import { BoosterPack } from '../../common/entities/booster.entity';
import { Interest } from '../../common/entities/interest.entity';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Interest,
      Profile,
      UserMatches,
      BoosterPack,
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}

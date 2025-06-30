import { AnalyticsService } from './analytics.service';
import { BoosterPack } from '../../common/entities/booster.entity';
import { BoosterRepository } from '../../common/repository/booster.repository';
import { BoosterUsage } from '../../common/entities/booster-usage.entity';
import { BoosterUsageRepository } from '../../common/repository/booster-usage.repository';
import { MatchRepository } from '../../common/repository/matches.repository';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserMatches,
      BoosterPack,
      BoosterUsage,
      Profile,
    ]),
  ],
  controllers: [StatsController],
  providers: [
    StatsService,
    AnalyticsService,
    UserRepository,
    MatchRepository,
    BoosterRepository,
    BoosterUsageRepository,
    ProfileRepository,
  ],
  exports: [AnalyticsService], // Export so other modules can use it
})
export class StatsModule {}

import { BoosterUsage } from '../../common/entities/booster-usage.entity';
import { BoosterUsageRepository } from '../../common/repository/booster-usage.repository';
import { CognitoService } from '../../auth/cognito.service';
import { MatchRepository } from '../../common/repository/matches.repository';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { Report } from '../../common/entities/report.entity';
import { ReportRepository } from '../../common/repository/report.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      UserMatches,
      Report,
      BoosterUsage,
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    ProfileRepository,
    MatchRepository,
    ReportRepository,
    BoosterUsageRepository,
    CognitoService,
  ],
  exports: [UsersService],
})
export class UsersModule {}

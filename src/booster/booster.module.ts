import { Module } from '@nestjs/common';
import { BoosterService } from './booster.service';
import { BoosterController } from './booster.controller';
import { MatchService } from './match.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../common/entities/profile.entity';
import { Interest } from '../common/entities/interest.entity';
import { User } from '../common/entities/user.entity';
import { UserMatches } from '../common/entities/user-matches.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Interest, User, UserMatches])],
  controllers: [BoosterController],
  providers: [BoosterService, MatchService],
})
export class BoosterModule {}

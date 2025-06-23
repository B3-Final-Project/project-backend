import { BoosterController } from './booster.controller';
import { BoosterPack } from '../../common/entities/booster.entity';
import { BoosterRepository } from '../../common/repository/booster.repository';
import { BoosterService } from './booster.service';
import { Interest } from '../../common/entities/interest.entity';
import { MatchRepository } from '../../common/repository/matches.repository';
import { MatchService } from './match.service';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';

@Module({
<<<<<<< HEAD
  imports: [TypeOrmModule.forFeature([Profile, Interest, User, UserMatches, BoosterPack])],
=======
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      Interest,
      User,
      UserMatches,
      BoosterPack,
    ]),
  ],
>>>>>>> main
  controllers: [BoosterController],
  providers: [
    BoosterService,
    MatchService,
    MatchRepository,
    UserRepository,
    ProfileRepository,
    BoosterRepository,
  ],
})
export class BoosterModule {}

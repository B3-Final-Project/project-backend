import { MatchRepository } from '../../common/repository/matches.repository';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserMatches, Profile, User])],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchRepository,
    ProfileRepository,
    UserRepository,
  ],
  exports: [MatchesService, MatchRepository],
})
export class MatchesModule {}

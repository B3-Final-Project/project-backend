import { MatchRepository } from '../../common/repository/matches.repository';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { StatsModule } from '../stats/stats.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserMatches } from '../../common/entities/user-matches.entity';
import { UserRepository } from '../../common/repository/user.repository';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserMatches, Profile, User]),
    StatsModule, // Import StatsModule to use AnalyticsService
    MessagesModule, // Import MessagesModule to use MessagesService and MessagesGateway
  ],
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

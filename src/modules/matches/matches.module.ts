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
import { MessagesService } from '../messages/messages.service';
import { Message } from 'src/common/entities/message.entity';
import { Conversation } from 'src/common/entities/conversation.entity';
import { ConversationRepository } from 'src/common/repository/conversation.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserMatches,
      Profile,
      User,
      Message,
      Conversation,
    ]),
    StatsModule, // Import StatsModule to use AnalyticsService
  ],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchRepository,
    ProfileRepository,
    UserRepository,
    MessagesService,
    ConversationRepository,
  ],
  exports: [MatchesService, MatchRepository],
})
export class MatchesModule {}

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoosterModule } from './modules/booster/booster.module';
import { BoosterPack } from './common/entities/booster.entity';
import { BoosterUsage } from './common/entities/booster-usage.entity';
import { CognitoStrategy } from './auth/cognito.strategy';
import { Constants } from './constants';
import { Conversation } from './common/entities/conversation.entity';
import { HateoasModule } from './common/hateoas.module';
import { Interest } from './common/entities/interest.entity';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { MatchesModule } from './modules/matches/matches.module';
import { Message } from './common/entities/message.entity';
import { MessagesModule } from './modules/messages/messages.module';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Profile } from './common/entities/profile.entity';
import { ProfileImagesModule } from './modules/profile-images/profile-images.module';
import { ProfileModule } from './modules/profile/profile.module';
import { Report } from './common/entities/report.entity';
import { ReportsModule } from './modules/reports/reports.module';
import { SeedModule } from './modules/seed/seed.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatsModule } from './modules/stats/stats.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './common/entities/user.entity';
import { UserMatches } from './common/entities/user-matches.entity';
import { GeolocateModule } from './modules/geolocate/geolocate.module';
import { UsersModule } from './modules/users/users.module';

export const ormConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: Constants.DATABASE_HOST,
  port: Constants.DATABASE_PORT,
  username: Constants.DATABASE_USER,
  password: Constants.DATABASE_PASSWORD,
  entities: [
    Interest,
    Profile,
    User,
    UserMatches,
    BoosterPack,
    BoosterUsage,
    Report,
    Message,
    Conversation,
  ],
  database: Constants.DATABASE_NAME,
  synchronize: true,
  ssl: {
    rejectUnauthorized: false, // Set to true in production with valid SSL certs
    sessionTimeout: 10000, // 10 seconds
  },
  extra: {
    connectionTimeoutMillis: 30000,
  },
};

@Module({
  imports: [
    TypeOrmModule.forRoot(ormConfig),
    HateoasModule,
    ProfileModule,
    BoosterModule,
    SettingsModule,
    GeolocateModule,
    MatchesModule,
    StatsModule,
    ReportsModule,
    UsersModule,
    ProfileImagesModule,
    MessagesModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService, CognitoStrategy],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

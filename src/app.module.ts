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
import { CognitoStrategy } from './auth/cognito.strategy';
import { Constants } from './constants';
import { Interest } from './common/entities/interest.entity';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { MatchesModule } from './modules/matches/matches.module';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { Profile } from './common/entities/profile.entity';
import { ProfileModule } from './modules/profile/profile.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './common/entities/user.entity';
import { UserMatches } from './common/entities/user-matches.entity';

export const ormConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: Constants.DATABASE_HOST,
  port: Constants.DATABASE_PORT,
  username: Constants.DATABASE_USER,
  password: Constants.DATABASE_PASSWORD,
  entities: [Interest, Profile, User, UserMatches, BoosterPack],
  database: Constants.DATABASE_NAME,
  synchronize: true,
  ssl: false,
  extra: {
    connectionTimeoutMillis: 30000,
  },
};

@Module({
  imports: [
    TypeOrmModule.forRoot(ormConfig),
    ProfileModule,
    BoosterModule,
    SettingsModule,
    MatchesModule,
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

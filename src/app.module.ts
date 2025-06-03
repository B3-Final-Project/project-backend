import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CognitoStrategy } from './auth/cognito.strategy';
import { ProfileModule } from './modules/profile/profile.module';
import { Constants } from './constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './common/entities/user.entity';
import { Interest } from './common/entities/interest.entity';
import { Profile } from './common/entities/profile.entity';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { BoosterModule } from './modules/booster/booster.module';
import { UserMatches } from './common/entities/user-matches.entity';
import { SettingsModule } from './modules/settings/settings.module';

export const ormConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: Constants.DATABASE_HOST,
  port: Constants.DATABASE_PORT,
  username: Constants.DATABASE_USER,
  password: Constants.DATABASE_PASSWORD,
  entities: [Interest, Profile, User, UserMatches],
  database: Constants.DATABASE_NAME,
  synchronize: true,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
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

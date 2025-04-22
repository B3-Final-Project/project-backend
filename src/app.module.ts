import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CognitoStrategy } from './auth/cognito.strategy';
import { PreferenceModule } from './preferences/preference.module';
import { Constants } from './constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './common/entities/user-profile.entity';
import { Interest } from './common/entities/interest.entity';
import { Preference } from './common/entities/preference.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: Constants.DATABASE_HOST,
      port: Constants.DATABASE_PORT,
      username: Constants.DATABASE_USER,
      password: Constants.DATABASE_PASSWORD,
      entities: [Interest, Preference, UserProfile],
      database: Constants.DATABASE_NAME,
      synchronize: true,
    }),
    PreferenceModule,
  ],
  controllers: [AppController],
  providers: [AppService, CognitoStrategy],
})
export class AppModule {}

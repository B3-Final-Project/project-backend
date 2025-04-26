import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CognitoStrategy } from './auth/cognito.strategy';
import { ProfileModule } from './profile/profile.module';
import { Constants } from './constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './common/entities/user-profile.entity';
import { Interest } from './common/entities/interest.entity';
import { Profile } from './common/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: Constants.DATABASE_HOST,
      port: Constants.DATABASE_PORT,
      username: Constants.DATABASE_USER,
      password: Constants.DATABASE_PASSWORD,
      entities: [Interest, Profile, UserProfile],
      database: Constants.DATABASE_NAME,
      synchronize: true,
    }),
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService, CognitoStrategy],
})
export class AppModule {}

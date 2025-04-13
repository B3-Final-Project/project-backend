import { Module } from '@nestjs/common';
import { CognitoStrategy } from './cognito.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleAuthModule } from './google/google.module';

@Module({
  imports: [PassportModule, GoogleAuthModule],
  providers: [CognitoStrategy, AuthService],
  controllers: [AuthController],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { CognitoStrategy } from './cognito.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule],
  providers: [CognitoStrategy, AuthService],
  controllers: [AuthController],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}

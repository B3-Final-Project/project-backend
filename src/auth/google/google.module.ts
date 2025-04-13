import { Module } from '@nestjs/common';
import { GoogleAuthService } from './google.service';
import { GoogleAuthController } from './google.controller';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [PassportModule],
  providers: [GoogleAuthService, GoogleStrategy],
  controllers: [GoogleAuthController],
})
export class GoogleAuthModule {}

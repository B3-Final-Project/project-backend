import { Controller, Get } from '@nestjs/common';
import { AuthSettingsDto } from './dto/auth-settings.dto';

@Controller('settings')
export class SettingsController {
  // gets credentials for the authentication service
  @Get('auth')
  public getAuthConfig(): AuthSettingsDto {
    return {
      userPool: process.env.COGNITO_USER_POOL,
      userPoolClient: process.env.COGNITO_CLIENT_ID,
      callbackUrl: process.env.FRONTEND_URL,
      hostedDomain: process.env.COGNITO_HOSTED_UI_DOMAIN,
    };
  }
}

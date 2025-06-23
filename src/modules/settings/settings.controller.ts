import { Controller, Get } from '@nestjs/common';
import { AuthSettingsDto } from './dto/auth-settings.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
<<<<<<< HEAD
  // gets credentials for the authentication service
=======
  @ApiOperation({
    summary: 'Récupère la configuration d’authentification Cognito',
  })
  @ApiOkResponse({ description: 'Configuration renvoyée avec succès' })
>>>>>>> main
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

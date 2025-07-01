import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseInterceptors } from '@nestjs/common';

import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';
import { AuthSettingsDto } from './dto/auth-settings.dto';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasLinks } from '../../common/decorators/hateoas.decorator';

@ApiTags('settings')
@Controller('settings')
@UseInterceptors(HateoasInterceptor)
export class SettingsController {
  @ApiOperation({
    summary: 'Récupère la configuration d’authentification Cognito',
  })
  @ApiOkResponse({ description: 'Configuration renvoyée avec succès' })
  @HateoasLinks('settings', AppLinkBuilders.settingsLinks())
  @Get('auth')
  @ApiOperation({ summary: 'Récupère la configuration d’authentification Cognito' })
  @ApiOkResponse({ description: 'Configuration renvoyée avec succès' })

  public getAuthConfig(): AuthSettingsDto {
    return {
      userPool: process.env.COGNITO_USER_POOL,
      userPoolClient: process.env.COGNITO_CLIENT_ID,
      callbackUrl: process.env.FRONTEND_URL,
      hostedDomain: process.env.COGNITO_HOSTED_UI_DOMAIN,
    };
  }
}

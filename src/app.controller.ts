import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: "Vérifie que l'application est en ligne" })
  @ApiResponse({ status: 200, description: 'Application en ligne' })
  @Get('health-check')
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Endpoint ping sécurisé' })
  @ApiResponse({ status: 200, description: 'Réponse Pong si authentifié' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseGuards(AuthGuard('jwt'))
  @Get('ping')
  ping(): string {
    return 'Pong';
  }
}

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: "Vérifie que l'application est en ligne" })
  @ApiResponse({
    status: 200,
    description: 'Application en ligne',
    type: String,
  })
  @Get('health-check')
  @ApiOperation({ summary: 'Vérifie que l\'application est en ligne' })
  @ApiResponse({ status: 200, description: 'Application en ligne' })
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Endpoint ping sécurisé' })
  @ApiResponse({
    status: 200,
    description: 'Réponse Pong si authentifié',
    type: String,
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @UseGuards(AuthGuard('jwt'))
  @Get('ping')
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Endpoint ping sécurisé' })
  @ApiResponse({ status: 200, description: 'Réponse Pong si authentifié' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  ping(): string {
    return 'Pong';
  }
}

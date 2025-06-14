import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { BoosterService } from './booster.service';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('booster')
@ApiBearerAuth('jwt-auth')
@Controller('booster')
@UseGuards(AuthGuard('jwt'))
export class BoosterController {
  public constructor(private readonly boosterService: BoosterService) {}

  @ApiOperation({ summary: 'Récupère un booster avec un nombre donné' })
  @ApiParam({
    name: 'count',
    type: Number,
    description: 'Nombre de boosters à récupérer',
  })
  @ApiResponse({ status: 200, description: 'Booster récupéré avec succès' })
  @ApiResponse({ status: 400, description: 'Paramètre count invalide' })
  @Get(':count')
  public getBooster(
    @Param('count') amount: string,
    @Req() req: HttpRequestDto,
  ) {
    return this.boosterService.getBooster(amount, req);
  }
}

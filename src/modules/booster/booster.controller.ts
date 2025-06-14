import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BoosterService } from './booster.service';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { RelationshipTypeEnum } from '../profile/enums';
import { AvailablePackDto } from './dto/available-pack.dto';
import { CreateBoosterDto } from './dto/create-booster.dto';
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

  @Get('list')
  public getAvailablePacks(): Promise<AvailablePackDto> {
    return this.boosterService.getAvailablePacks();
  }

  @Post()
  public async createBooster(
    @Req() req: HttpRequestDto,
    @Body() body: CreateBoosterDto,
  ): Promise<void> {
    return this.boosterService.createBooster(req, body);
  }

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
    @Param('count', ParseIntPipe) amount: number,
    @Query('type', new ParseEnumPipe(RelationshipTypeEnum, { optional: true }))
    type: RelationshipTypeEnum,
    @Req() req: HttpRequestDto,
  ) {
    return this.boosterService.getBooster(amount, req, type);
  }
}

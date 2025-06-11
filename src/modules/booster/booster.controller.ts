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

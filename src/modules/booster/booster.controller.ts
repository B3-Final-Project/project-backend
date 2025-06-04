import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BoosterService } from './booster.service';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { RelationshipTypeEnum } from '../profile/enums';

@Controller('booster')
@UseGuards(AuthGuard('jwt'))
export class BoosterController {
  public constructor(private readonly boosterService: BoosterService) {}

  @Get(':count?:type')
  public getBooster(
    @Param('count') amount: string,
    @Query(
      'type',
      new ParseEnumPipe({
        enum: RelationshipTypeEnum,
      }),
    )
    type: RelationshipTypeEnum,
    @Req() req: HttpRequestDto,
  ) {
    return this.boosterService.getBooster(amount, req, type);
  }
}

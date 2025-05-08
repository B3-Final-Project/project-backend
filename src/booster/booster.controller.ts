import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { BoosterService } from './booster.service';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../common/dto/http-request.dto';

@Controller('booster')
@UseGuards(AuthGuard('jwt'))
export class BoosterController {
  public constructor(private readonly boosterService: BoosterService) {}

  @Get(':count')
  public getBooster(
    @Param('count') amount: string,
    @Req() req: HttpRequestDto,
  ) {
    return this.boosterService.getBooster(amount, req);
  }
}

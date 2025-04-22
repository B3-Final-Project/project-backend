import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PreferenceService } from './preference.service';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { Preference } from '../common/entities/preference.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Get('all')
  public async getAllPreferences() {
    return this.preferenceService.getAllPreferences();
  }

  @Get()
  public async getPreferences(@Req() req: HttpRequestDto) {
    return this.preferenceService.getPreferences(req);
  }

  @Put(':userId')
  public async updatePreference(
    @Param('userId') userId: string,
    @Body() body: UpdatePreferenceDto,
  ) {
    return this.preferenceService.updatePreference(body, userId);
  }

  @Put(':userId/interests')
  public async updatePreferenceInterests(
    @Param('userId') userId: string,
    @Body() body: { data: string[] },
  ): Promise<Preference> {
    return this.preferenceService.updatePreferenceInterests(userId, body.data);
  }

  @Post()
  public async createPreference(@Body() body: UpdatePreferenceDto) {
    return this.preferenceService.createPreference(body);
  }
}

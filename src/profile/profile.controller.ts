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
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../common/entities/profile.entity';
import { ProfileService } from './profile.service';

@UseGuards(AuthGuard('jwt'))
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('all')
  public async getAllProfiles() {
    return this.profileService.getAllProfiles();
  }

  @Get()
  public async getProfiles(@Req() req: HttpRequestDto) {
    return this.profileService.getProfiles(req);
  }

  @Put(':userId')
  public async updateProfile(
    @Param('userId') userId: string,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(body, userId);
  }

  @Put(':userId/interests')
  public async updateProfileInterests(
    @Param('userId') userId: string,
    @Body() body: { data: string[] },
  ): Promise<Profile> {
    return this.profileService.updateProfileInterests(userId, body.data);
  }

  @Post()
  public async createProfile(@Body() body: UpdateProfileDto) {
    return this.profileService.createProfile(body);
  }
}

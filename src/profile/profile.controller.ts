import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Req,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
  Delete,
  ParseIntPipe,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../common/entities/profile.entity';
import { ProfileService } from './services/profile.service';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AuthGuard('jwt'))
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  public async getProfile(@Req() req: HttpRequestDto) {
    return this.profileService.getProfile(req);
  }

  @Put()
  public async updateProfile(
    @Req() req: HttpRequestDto,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(body, req);
  }

  @Put(':userId/interests')
  public async updateProfileInterests(
    @Param('userId') userId: string,
    @Body() body: { data: string[] },
  ): Promise<Profile> {
    return this.profileService.updateProfileInterests(userId, body.data);
  }

  @Post()
  public async createProfile(
    @Req() req: HttpRequestDto,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.createProfile(body, req);
  }

  @Patch()
  public async updateProfileField(
    @Body() body: Partial<UpdateProfileDto>,
    @Req() req: HttpRequestDto,
  ) {
    return this.profileService.updateProfileField(body, req);
  }

  // Image goes through S3 interceptor and automatically uploads to S3
  // returning only the object URL
  @Put('image/:index')
  @UseInterceptors(FileInterceptor('image'))
  public async uploadImage(
    @Param(
      'index',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException(
            'Index must be a valid number between 0 and 5',
          ),
      }),
    )
    index: number,
    @UploadedFile() file: Express.MulterS3.File,
    @Req() req: HttpRequestDto,
  ) {
    return this.profileService.uploadImage(file, req, index);
  }

  @Delete('image/:index')
  public async deleteImage(
    @Param(
      'index',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException(
            'Index must be a valid number between 0 and 5',
          ),
      }),
    )
    index: number,
    @Req() req: HttpRequestDto,
  ) {
    if (index < 0 || index > 5) {
      throw new BadRequestException('Image index must be between 0 and 5');
    }

    return this.profileService.removeImage(req, index);
  }
}

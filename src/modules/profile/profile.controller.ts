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
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileService } from './services/profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt-auth')
@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Récupère le profil de l’utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - jeton JWT manquant ou invalide',
  })
  public async getProfile(@Req() req: HttpRequestDto) {
    return this.profileService.getProfile(req);
  }

  @Put()
  @ApiOperation({ summary: 'Met à jour le profil complet de l’utilisateur' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profil mis à jour avec succès' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - jeton JWT manquant ou invalide',
  })
  public async updateProfile(
    @Req() req: HttpRequestDto,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(body, req);
  }

  @Put(':userId/interests')
  @ApiOperation({ summary: 'Met à jour les centres d’intérêt d’un utilisateur' })
  @ApiParam({ name: 'userId', type: String, description: 'ID de l’utilisateur' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['data'],
    },
  })
  @ApiResponse({ status: 200, description: 'Intérêts mis à jour avec succès', type: Profile })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - jeton JWT manquant ou invalide',
  })
  public async updateProfileInterests(
    @Param('userId') userId: string,
    @Body() body: { data: string[] },
  ): Promise<Profile> {
    return this.profileService.updateProfileInterests(userId, body.data);
  }

  @Post()
  @ApiOperation({ summary: 'Crée un nouveau profil pour l’utilisateur connecté' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 201, description: 'Profil créé avec succès' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - jeton JWT manquant ou invalide',
  })
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
  @ApiOperation({ summary: 'Upload une image de profil à un index donné' })
  @ApiParam({
    name: 'index',
    type: Number,
    description: 'Index de l’image (0 à 5)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploadée avec succès' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - jeton JWT manquant ou invalide',
  })
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
  @ApiOperation({ summary: 'Supprime une image de profil à un index donné' })
  @ApiParam({
    name: 'index',
    type: Number,
    description: 'Index de l’image (0 à 5)',
  })
  @ApiResponse({ status: 200, description: 'Image supprimée avec succès' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - jeton JWT manquant ou invalide',
  })
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

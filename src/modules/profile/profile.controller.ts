import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './services/profile.service';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { Profile } from '../../common/entities/profile.entity';
import { UserManagementResponseDto } from './dto/user-management.dto';
import { IsAdmin } from '../../auth/admin.guard';
import {
  ReportUserResponseDto,
  BanUserResponseDto,
} from './dto/admin-actions.dto';
import { ReportDto } from './dto/report.dto';

@ApiTags('profiles')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
  @ApiOperation({ summary: 'Récupère tous les profils' })
  @ApiResponse({
    status: 200,
    description: 'Profils récupérés avec succès',
    type: [Profile],
  })
  @Get('all')
  @UseGuards(IsAdmin)
  public async getAllProfiles(
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortBy') sortBy?: 'reportCount' | 'createdAt', // Optional sort field
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('search') search?: string, // Optional search term
  ): Promise<UserManagementResponseDto> {
    return this.profileService.getAllProfiles(
      offset,
      limit,
      sortBy,
      sortOrder,
      search,
    );
  }

  @ApiOperation({ summary: 'Récupère un profil par son ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID du profil à récupérer',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès',
    type: Profile,
  })
  @UseGuards(IsAdmin)
  @Get(':id')
  public async getProfileById(@Param('id') id: string) {
    return this.profileService.getProfileById(id);
  }

  @ApiOperation({ summary: 'Récupère le profil de l’utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès',
    type: Profile,
  })
  @Get()
  public async getProfile(@Req() req: HttpRequestDto) {
    return this.profileService.getProfile(req);
  }

  @ApiOperation({ summary: 'Met à jour le profil complet de l’utilisateur' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour avec succès',
    type: Profile,
  })
  @Put()
  public async updateProfile(
    @Req() req: HttpRequestDto,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(body, req);
  }

  @ApiOperation({
    summary: 'Crée un nouveau profil pour l’utilisateur connecté',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Profil créé avec succès',
    type: Profile,
  })
  @Post()
  public async createProfile(
    @Req() req: HttpRequestDto,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.createProfile(body, req);
  }

  @ApiOperation({ summary: 'Patch une section du profil utilisateur' })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Section partielle du profil à patcher',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil patché avec succès',
    type: Profile,
  })
  @Patch()
  public async updateProfileField(
    @Body() body: Partial<UpdateProfileDto>,
    @Req() req: HttpRequestDto,
  ) {
    return this.profileService.updateProfileField(body, req);
  }

  // Image goes through S3 interceptor and automatically uploads to S3
  // returning only the object URL
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

  @ApiOperation({ summary: 'Supprime une image de profil à un index donné' })
  @ApiParam({
    name: 'index',
    type: Number,
    description: 'Index de l’image (0 à 5)',
  })
  @ApiResponse({ status: 200, description: 'Image supprimée avec succès' })
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

  // Regular user report endpoint
  @ApiOperation({ summary: 'Report a user' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user to report',
  })
  @ApiResponse({
    status: 200,
    description: 'User reported successfully',
    type: ReportUserResponseDto,
  })
  @Post(':profileId/report')
  public async reportUserByUser(
    @Param('profileId', ParseIntPipe) reportedProfileId: number,
    @Req() req: HttpRequestDto,
    @Body() body: ReportDto,
  ): Promise<ReportUserResponseDto> {
    return this.profileService.reportUser(
      reportedProfileId,
      req.user.userId,
      body,
    );
  }

  @ApiOperation({ summary: 'Ban a user' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user to ban',
  })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
    type: BanUserResponseDto,
  })
  @Post(':userId/ban')
  @UseGuards(IsAdmin)
  public async banUser(
    @Param('userId') userId: string,
  ): Promise<BanUserResponseDto> {
    return this.profileService.banUser(userId);
  }

  @ApiOperation({ summary: 'Unban a user' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user to unban',
  })
  @ApiResponse({
    status: 200,
    description: 'User unbanned successfully',
    type: BanUserResponseDto,
  })
  @Post(':userId/unban')
  @UseGuards(IsAdmin)
  public async unbanUser(
    @Param('userId') userId: string,
  ): Promise<BanUserResponseDto> {
    return this.profileService.unbanUser(userId);
  }

  // Admin endpoints for report management
  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
  })
  @UseGuards(IsAdmin)
  @Get('reports')
  public async getAllReports(
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.profileService.getAllReports(offset, limit);
  }

  @ApiOperation({ summary: 'Get reports for a specific profile (Admin only)' })
  @ApiParam({
    name: 'profileId',
    type: Number,
    description: 'ID of the profile to get reports for',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile reports retrieved successfully',
  })
  @UseGuards(IsAdmin)
  @Get(':profileId/reports')
  public async getReportsForProfile(
    @Param('profileId', ParseIntPipe) profileId: number,
  ) {
    return this.profileService.getReportsForProfile(profileId);
  }

  @ApiOperation({ summary: 'Delete a report (Admin only)' })
  @ApiParam({
    name: 'reportId',
    type: Number,
    description: 'ID of the report to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  @UseGuards(IsAdmin)
  @Delete('reports/:reportId')
  public async deleteReport(@Param('reportId', ParseIntPipe) reportId: number) {
    return this.profileService.deleteReport(reportId);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
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
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasLinks } from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';

@ApiTags('profiles')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HateoasInterceptor)
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
  @HateoasLinks('profile', AppLinkBuilders.profileLinks())
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
  @HateoasLinks('profile', AppLinkBuilders.profileLinks())
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
  @HateoasLinks('profile', AppLinkBuilders.profileLinks())
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

  @ApiOperation({ summary: 'Met à jour le profil complet de l’utilisateur' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour avec succès',
    type: Profile,
  })
  @HateoasLinks('profile', AppLinkBuilders.profileLinks())
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

  @ApiOperation({
    summary: 'Crée un nouveau profil pour l’utilisateur connecté',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Profil créé avec succès',
    type: Profile,
  })
  @HateoasLinks('profile', AppLinkBuilders.profileLinks())
  @Post()
  @ApiOperation({
    summary: 'Crée un nouveau profil pour l’utilisateur connecté',
  })
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
  @HateoasLinks('profile', AppLinkBuilders.profileLinks())
  @Patch()
  public async updateProfileField(
    @Body() body: Partial<UpdateProfileDto>,
    @Req() req: HttpRequestDto,
  ) {
    return this.profileService.updateProfileField(body, req);
  }
}

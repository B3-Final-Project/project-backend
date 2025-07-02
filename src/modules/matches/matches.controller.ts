import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MatchesService } from './matches.service';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { MatchActionResponseDto } from './dto/match-response.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasLinks } from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';
import { Profile } from '../../common/entities/profile.entity';

@ApiTags('matches')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HateoasInterceptor)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * Get all mutual matches for the authenticated user
   */
  @ApiOperation({
    summary: 'Récupère tous les matchs mutuels de l’utilisateur authentifié',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des matchs',
    type: [Profile],
  })
  @HateoasLinks('match', AppLinkBuilders.matchLinks())
  @Get()
  async getUserMatches(@Req() req: HttpRequestDto): Promise<Profile[]> {
    return this.matchesService.getUserMatches(req);
  }

  /**
   * Get profiles that liked you but you haven't responded to yet
   */
  @ApiOperation({
    summary:
      "Récupère les profils qui vous ont liké mais auxquels vous n'avez pas encore répondu",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des matchs en attente',
    type: [Profile],
  })
  @HateoasLinks('match', AppLinkBuilders.matchLinks())
  @Get('pending')
  async getPendingMatches(@Req() req: HttpRequestDto): Promise<Profile[]> {
    return this.matchesService.getPendingMatches(req);
  }

  /**
   * Get profiles you liked but haven't heard back from
   */
  @ApiOperation({
    summary:
      "Récupère les profils que vous avez liké mais qui n'ont pas encore répondu",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des likes envoyés',
    type: [Profile],
  })
  @HateoasLinks('match', AppLinkBuilders.matchLinks())
  @Get('sent')
  async getSentLikes(@Req() req: HttpRequestDto): Promise<Profile[]> {
    return this.matchesService.getSentLikes(req);
  }

  /**
   * Get match details for a specific profile
   */
  @ApiOperation({
    summary: "Récupère les détails d'un match pour un profil donné",
  })
  @ApiParam({
    name: 'profileId',
    type: Number,
    description: 'ID du profil cible',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du match',
    type: Object,
  })
  @HateoasLinks('match', AppLinkBuilders.matchLinks())
  @Get('details/:profileId')
  async getMatchDetails(
    @Param(
      'profileId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Profile ID must be a valid number'),
      }),
    )
    profileId: number,
    @Req() req: HttpRequestDto,
  ): Promise<any> {
    return this.matchesService.getMatchDetails(req, profileId);
  }

  /**
   * Like a profile
   */
  @ApiOperation({ summary: 'Like un profil' })
  @ApiParam({
    name: 'profileId',
    type: Number,
    description: 'ID du profil à liker',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat du like',
    type: MatchActionResponseDto,
  })
  @HateoasLinks('match', AppLinkBuilders.matchLinks())
  @Post('like/:profileId')
  async likeProfile(
    @Param(
      'profileId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Profile ID must be a valid number'),
      }),
    )
    profileId: number,
    @Req() req: HttpRequestDto,
  ): Promise<MatchActionResponseDto> {
    return this.matchesService.likeProfile(req, profileId);
  }

  /**
   * Pass/reject a profile
   */
  @ApiOperation({ summary: 'Passe/rejette un profil' })
  @ApiParam({
    name: 'profileId',
    type: Number,
    description: 'ID du profil à passer',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil passé avec succès',
  })
  @HateoasLinks('match', AppLinkBuilders.matchLinks())
  @Post('pass/:profileId')
  async passProfile(
    @Param(
      'profileId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Profile ID must be a valid number'),
      }),
    )
    profileId: number,
    @Req() req: HttpRequestDto,
  ) {
    return await this.matchesService.passProfile(req, profileId);
  }
}

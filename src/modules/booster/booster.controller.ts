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
  UseInterceptors,
} from '@nestjs/common';
import { BoosterService } from './booster.service';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { RelationshipTypeEnum } from '../profile/enums';
import { AvailablePackDto } from './dto/available-pack.dto';
import { CreateBoosterDto } from './dto/create-booster.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import {
  HateoasCollectionOnly,
  HateoasLinks,
} from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';

@ApiTags('booster')
@ApiBearerAuth('jwt-auth')
@Controller('booster')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HateoasInterceptor)
export class BoosterController {
  public constructor(private readonly boosterService: BoosterService) {}

  @ApiOperation({ summary: 'Liste tous les packs booster disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Liste des packs disponibles',
    type: AvailablePackDto,
  })
  @HateoasCollectionOnly('booster', AppLinkBuilders.boosterCollectionLinks())
  @Get('list')
  public getAvailablePacks() {
    return this.boosterService.getAvailablePacks();
  }

  @ApiOperation({ summary: 'Crée un nouveau pack booster (admin seulement)' })
  @ApiBody({ type: CreateBoosterDto })
  @ApiResponse({ status: 201, description: 'Booster créé avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé ou non admin',
  })
  @HateoasLinks('booster', AppLinkBuilders.boosterLinks())
  @Post()
  public async createBooster(
    @Req() req: HttpRequestDto,
    @Body() body: CreateBoosterDto,
  ): Promise<void> {
    return this.boosterService.createBooster(req, body);
  }

  @ApiOperation({ summary: 'Récupère un booster avec un nombre donné' })
  @ApiParam({
    name: 'count',
    type: Number,
    description: 'Nombre de boosters à récupérer',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: RelationshipTypeEnum,
    description: 'Type de relation (optionnel)',
  })
  @ApiResponse({
    status: 200,
    description: 'Booster récupéré avec succès',
    type: [Object],
  })
  @ApiResponse({ status: 400, description: 'Paramètre count invalide' })
  @HateoasCollectionOnly('booster', AppLinkBuilders.boosterCollectionLinks())
  @Get(':count')
  @ApiOperation({ summary: 'Récupère un booster avec un nombre donné' })
  @ApiParam({
    name: 'count',
    type: Number,
    description: 'Nombre de boosters à récupérer',
  })
  @ApiResponse({ status: 200, description: 'Booster récupéré avec succès' })
  @ApiResponse({ status: 400, description: 'Paramètre count invalide' })
  public getBooster(
    @Param('count', ParseIntPipe) amount: number,
    @Query('type', new ParseEnumPipe(RelationshipTypeEnum, { optional: true }))
    type: RelationshipTypeEnum,
    @Req() req: HttpRequestDto,
  ) {
    return this.boosterService.getBooster(amount, req, type);
  }
}

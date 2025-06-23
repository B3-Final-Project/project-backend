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
} from '@nestjs/common';
import { BoosterService } from './booster.service';
import { AuthGuard } from '@nestjs/passport';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { RelationshipTypeEnum } from '../profile/enums';
import { AvailablePackDto } from './dto/available-pack.dto';
import { CreateBoosterDto } from './dto/create-booster.dto';
<<<<<<< HEAD
=======
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
>>>>>>> main

@ApiTags('booster')
@ApiBearerAuth('jwt-auth')
@Controller('booster')
@UseGuards(AuthGuard('jwt'))
export class BoosterController {
  public constructor(private readonly boosterService: BoosterService) {}

<<<<<<< HEAD
=======
  @ApiOperation({ summary: 'Liste tous les packs booster disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Liste des packs disponibles',
    type: AvailablePackDto,
  })
>>>>>>> main
  @Get('list')
  public getAvailablePacks(): Promise<AvailablePackDto> {
    return this.boosterService.getAvailablePacks();
  }

<<<<<<< HEAD
=======
  @ApiOperation({ summary: 'Crée un nouveau pack booster (admin seulement)' })
  @ApiBody({ type: CreateBoosterDto })
  @ApiResponse({ status: 201, description: 'Booster créé avec succès' })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé ou non admin',
  })
>>>>>>> main
  @Post()
  public async createBooster(
    @Req() req: HttpRequestDto,
    @Body() body: CreateBoosterDto,
  ): Promise<void> {
    return this.boosterService.createBooster(req, body);
  }

<<<<<<< HEAD
=======
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
>>>>>>> main
  @Get(':count')
  public getBooster(
    @Param('count', ParseIntPipe) amount: number,
    @Query('type', new ParseEnumPipe(RelationshipTypeEnum, { optional: true }))
    type: RelationshipTypeEnum,
    @Req() req: HttpRequestDto,
  ) {
    return this.boosterService.getBooster(amount, req, type);
  }
}

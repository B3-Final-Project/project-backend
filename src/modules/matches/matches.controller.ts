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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MatchesService } from './matches.service';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { Profile } from '../../common/entities/profile.entity';
import { MatchResponseDto, MatchActionDto } from './dto/match-response.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * Get all mutual matches for the authenticated user
   */
  @Get()
  async getUserMatches(@Req() req: HttpRequestDto): Promise<Profile[]> {
    return this.matchesService.getUserMatches(req);
  }

  /**
   * Get profiles that liked you but you haven't responded to yet
   */
  @Get('pending')
  async getPendingMatches(@Req() req: HttpRequestDto): Promise<Profile[]> {
    return this.matchesService.getPendingMatches(req);
  }

  /**
   * Get profiles you liked but haven't heard back from
   */
  @Get('sent')
  async getSentLikes(@Req() req: HttpRequestDto): Promise<Profile[]> {
    return this.matchesService.getSentLikes(req);
  }

  /**
   * Get match details for a specific profile
   */
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
  ): Promise<MatchResponseDto> {
    return this.matchesService.likeProfile(req, profileId);
  }

  /**
   * Pass/reject a profile
   */
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
  ): Promise<MatchActionDto> {
    await this.matchesService.passProfile(req, profileId);
    return { success: true };
  }
}

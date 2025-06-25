import {
  ActivityStatsDto,
  AppStatsDto,
  BoosterStatsDto,
  ComprehensiveStatsDto,
  DetailedStatsDto,
  EngagementStatsDto,
  UserDemographicsDto,
} from './dto/stats.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @ApiOperation({ summary: 'Get general application statistics' })
  @ApiResponse({
    status: 200,
    description: 'Application statistics retrieved successfully',
    type: AppStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('app')
  async getAppStats(): Promise<AppStatsDto> {
    return this.statsService.getAppStats();
  }

  @ApiOperation({ summary: 'Get statistics per booster pack type' })
  @ApiResponse({
    status: 200,
    description: 'Booster statistics retrieved successfully',
    type: [BoosterStatsDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('boosters')
  async getBoosterStats(): Promise<BoosterStatsDto[]> {
    return this.statsService.getBoosterStats();
  }

  @ApiOperation({
    summary: 'Get detailed statistics including app and booster stats',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed statistics retrieved successfully',
    type: DetailedStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('detailed')
  async getDetailedStats(): Promise<DetailedStatsDto> {
    return this.statsService.getDetailedStats();
  }

  @ApiOperation({ summary: 'Get total number of users' })
  @ApiResponse({
    status: 200,
    description: 'Total users count retrieved successfully',
    schema: { type: 'number', example: 1250 },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('users/count')
  async getUsersCount(): Promise<number> {
    return this.statsService.getUsersCount();
  }

  @ApiOperation({ summary: 'Get total number of matches' })
  @ApiResponse({
    status: 200,
    description: 'Total matches count retrieved successfully',
    schema: { type: 'number', example: 845 },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('matches/count')
  async getMatchesCount(): Promise<number> {
    return this.statsService.getMatchesCount();
  }

  @ApiOperation({ summary: 'Get total number of passes' })
  @ApiResponse({
    status: 200,
    description: 'Total passes count retrieved successfully',
    schema: { type: 'number', example: 2340 },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('passes/count')
  async getPassesCount(): Promise<number> {
    return this.statsService.getPassesCount();
  }

  @ApiOperation({ summary: 'Get total number of likes' })
  @ApiResponse({
    status: 200,
    description: 'Total likes count retrieved successfully',
    schema: { type: 'number', example: 1890 },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('likes/count')
  async getLikesCount(): Promise<number> {
    return this.statsService.getLikesCount();
  }

  @ApiOperation({ summary: 'Get total booster usage count' })
  @ApiResponse({
    status: 200,
    description: 'Total booster usage count retrieved successfully',
    schema: { type: 'number', example: 320 },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('boosters/usage/total')
  async getTotalBoosterUsage(): Promise<number> {
    return this.statsService.getTotalBoosterUsage();
  }

  @ApiOperation({ summary: 'Get user demographics statistics' })
  @ApiResponse({
    status: 200,
    description: 'User demographics retrieved successfully',
    type: UserDemographicsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('demographics')
  async getUserDemographics(): Promise<UserDemographicsDto> {
    return this.statsService.getUserDemographics();
  }

  @ApiOperation({ summary: 'Get user engagement statistics' })
  @ApiResponse({
    status: 200,
    description: 'Engagement statistics retrieved successfully',
    type: EngagementStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('engagement')
  async getEngagementStats(): Promise<EngagementStatsDto> {
    return this.statsService.getEngagementStats();
  }

  @ApiOperation({ summary: 'Get activity statistics' })
  @ApiResponse({
    status: 200,
    description: 'Activity statistics retrieved successfully',
    type: ActivityStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('activity')
  async getActivityStats(): Promise<ActivityStatsDto> {
    return this.statsService.getActivityStats();
  }

  @ApiOperation({
    summary: 'Get comprehensive statistics (all stats combined)',
  })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive statistics retrieved successfully',
    type: ComprehensiveStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('comprehensive')
  async getComprehensiveStats(): Promise<ComprehensiveStatsDto> {
    return this.statsService.getComprehensiveStats();
  }
}

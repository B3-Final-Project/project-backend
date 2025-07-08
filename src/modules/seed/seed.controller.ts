import {
  Controller,
  Post,
  UseGuards,
  Query,
  ParseIntPipe,
  HttpStatus,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsAdmin } from '../../auth/admin.guard';
import { SeedService } from './seed.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SeedDto } from './dto/seed.dto';
import { SeedAllResponse } from './response/seed-all.response';

@ApiTags('seed')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'), IsAdmin)
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  /**
   * Seed boosters in the database
   */
  @ApiOperation({
    summary: 'Seed boosters in the database (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Boosters seeded successfully',
  })
  @Post('boosters')
  async seedBoosters(): Promise<{ message: string; count: number }> {
    return await this.seedService.seedBoosters();
  }

  /**
   * Seed interests in the database
   */
  @ApiOperation({
    summary: 'Seed interests in the database (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Interests seeded successfully',
  })
  @Post('interests')
  async seedInterests(): Promise<{ message: string; count: number }> {
    const count = await this.seedService.seedInterests();
    return {
      message: 'Interests seeded successfully',
      count,
    };
  }

  /**
   * Seed users in the database
   */
  @ApiOperation({
    summary: 'Seed users in the database (Admin only)',
  })
  @ApiQuery({
    name: 'count',
    type: Number,
    description: 'Number of users to seed',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Users seeded successfully',
  })
  @Post('users')
  async seedUsers(
    @Query(
      'count',
      new ParseIntPipe({
        optional: true,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Count must be a valid number'),
      }),
    )
    count?: number,
  ): Promise<{ message: string; count: number }> {
    const userCount = await this.seedService.seedUsers(
      count ?? 50,
      count ?? 50 * 2,
    );
    return {
      message: 'Users seeded successfully',
      count: userCount,
    };
  }

  /**
   * Seed both interests and users in the database
   */
  @ApiOperation({
    summary: 'Seed both interests and users in the database (Admin only)',
  })
  @ApiQuery({
    name: 'userCount',
    type: Number,
    description: 'Number of users to seed',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Interests and users seeded successfully',
  })
  @Post('all')
  async seedAll(@Body() body: SeedDto): Promise<SeedAllResponse> {
    const { interestCount, userCount: seedUserCount } =
      await this.seedService.seedUsersAndInterests(body.count || 50);

    return {
      message: 'Interests and users seeded successfully',
      interestCount,
      userCount: seedUserCount,
    };
  }

  /**
   * Clear all users from the database
   */
  @ApiOperation({
    summary: 'Clear all users from the database (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users cleared successfully',
  })
  @Post('clear/users')
  async clearUsers(): Promise<{ message: string }> {
    await this.seedService.clearUsers();
    return {
      message: 'All users cleared successfully',
    };
  }

  /**
   * Clear all interests from the database
   */
  @ApiOperation({
    summary: 'Clear all interests from the database (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Interests cleared successfully',
  })
  @Post('clear/interests')
  async clearInterests(): Promise<{ message: string }> {
    await this.seedService.clearInterests();
    return {
      message: 'All interests cleared successfully',
    };
  }

  /**
   * Clear all boosters from the database
   */
  @ApiOperation({
    summary: 'Clear all boosters from the database (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Boosters cleared successfully',
  })
  @Post('clear/boosters')
  async clearBoosters(): Promise<{ message: string }> {
    await this.seedService.clearBoosters();
    return {
      message: 'All boosters cleared successfully',
    };
  }

  /**
   * Clear all data from the database
   */
  @ApiOperation({
    summary: 'Clear all data from the database (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'All data cleared successfully',
  })
  @Post('clear/all')
  async clearAll(): Promise<{ message: string }> {
    await this.seedService.clearAll();
    return {
      message: 'All data cleared successfully',
    };
  }
}

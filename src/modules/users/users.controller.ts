import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsAdmin } from '../../auth/admin.guard';
import { UsersService } from './users.service';
import { BanResponseDto, BanStatusResponseDto } from './dto/ban-response.dto';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasLinks } from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';

@ApiTags('users')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HateoasInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a ban for a user (Admin only)' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user to ban',
  })
  @ApiResponse({
    status: 201,
    description: 'User banned successfully',
    type: BanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User is already banned',
  })
  @UseGuards(IsAdmin)
  @HateoasLinks('user', AppLinkBuilders.userLinks())
  @Post(':userId/bans')
  public async banUser(
    @Param('userId') userId: string,
  ): Promise<BanResponseDto> {
    return this.usersService.banUser(userId);
  }

  @ApiOperation({ summary: 'Remove ban from a user (Admin only)' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user to unban',
  })
  @ApiResponse({
    status: 200,
    description: 'User unbanned successfully',
    type: BanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or not banned',
  })
  @UseGuards(IsAdmin)
  @HateoasLinks('user', AppLinkBuilders.userLinks())
  @Delete(':userId/bans')
  public async unbanUser(
    @Param('userId') userId: string,
  ): Promise<BanResponseDto> {
    return this.usersService.unbanUser(userId);
  }

  @ApiOperation({ summary: 'Get ban status for a user (Admin only)' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'ID of the user to check ban status',
  })
  @ApiResponse({
    status: 200,
    description: 'Ban status retrieved successfully',
    type: BanStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @UseGuards(IsAdmin)
  @HateoasLinks('user', AppLinkBuilders.userLinks())
  @Get(':userId/bans')
  public async getUserBanStatus(
    @Param('userId') userId: string,
  ): Promise<BanStatusResponseDto> {
    return this.usersService.getUserBanStatus(userId);
  }
}

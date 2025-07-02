import { BanResponseDto, BanStatusResponseDto } from './dto/ban-response.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { BoosterUsageRepository } from '../../common/repository/booster-usage.repository';
import { CognitoService } from '../../auth/cognito.service';
import { HttpRequestDto } from 'src/common/dto/http-request.dto';
import { MatchRepository } from '../../common/repository/matches.repository';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { ReportRepository } from '../../common/repository/report.repository';
import { UserRepository } from '../../common/repository/user.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly matchRepository: MatchRepository,
    private readonly reportRepository: ReportRepository,
    private readonly boosterUsageRepository: BoosterUsageRepository,
    private readonly cognitoService: CognitoService,
  ) {}

  async banUser(userId: string): Promise<BanResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update user ban status
    await this.userRepository.updateBanStatus(userId, true);

    return {
      userId,
      isBanned: true,
      timestamp: new Date(),
      reason: 'Banned by administrator',
      _links: {
        self: { href: `/users/${userId}/bans` },
        user: { href: `/users/${userId}` },
        unban: { href: `/users/${userId}/bans`, method: 'DELETE' },
      },
    };
  }

  async unbanUser(userId: string): Promise<BanResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update user ban status
    await this.userRepository.updateBanStatus(userId, false);

    return {
      userId,
      isBanned: false,
      timestamp: new Date(),
      _links: {
        self: { href: `/users/${userId}/bans` },
        user: { href: `/users/${userId}` },
        ban: { href: `/users/${userId}/bans`, method: 'POST' },
      },
    };
  }

  async getUserBanStatus(userId: string): Promise<BanStatusResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isBanned = false;

    return {
      userId,
      isBanned,
      bannedAt: isBanned ? new Date() : undefined,
      reason: isBanned ? 'Banned by administrator' : undefined,
      _links: {
        self: { href: `/users/${userId}/bans` },
        user: { href: `/users/${userId}` },
        ...(isBanned
          ? { unban: { href: `/users/${userId}/bans`, method: 'DELETE' } }
          : { ban: { href: `/users/${userId}/bans`, method: 'POST' } }),
      },
    };
  }

  public async deleteUser(req: HttpRequestDto) {
    const userId = req.user.userId;
    const user = await this.userRepository.findUserWithProfile(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const profileId = user.profile.id;

    // 1. Delete all matches where this profile is involved
    await this.matchRepository.deleteByProfileId(profileId);

    // 2. Delete all reports related to this profile
    await this.reportRepository.deleteByProfileId(profileId);

    // 3. Delete all booster usages for this user
    await this.boosterUsageRepository.deleteByUserId(user.id);

    // 4. Remove interests association from profile
    await this.profileRepository.removeInterests(profileId);

    // 5. Delete the user and profile in a transaction to handle FK constraints
    await this.userRepository.deleteUserAndProfile(userId, profileId);

    // 6. Delete the user from Cognito
    try {
      await this.cognitoService.deleteUser(userId);
    } catch (error) {
      this.logger.error(
        `Failed to delete Cognito user ${userId}, but database cleanup completed`,
        error,
      );
      // Database cleanup is done, but Cognito deletion failed
      // You might want to handle this case based on your requirements
    }

    this.logger.log(
      `User with ID ${userId} and all related data deleted successfully`,
    );
  }
}

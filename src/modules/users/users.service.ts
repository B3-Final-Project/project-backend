import { BanResponseDto, BanStatusResponseDto } from './dto/ban-response.dto';
import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRepository } from '../../common/repository/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

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
}

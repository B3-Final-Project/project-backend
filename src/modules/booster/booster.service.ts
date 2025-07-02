import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AnalyticsService } from '../stats/analytics.service';
import { BoosterRepository } from '../../common/repository/booster.repository';
import { CreateBoosterDto } from './dto/create-booster.dto';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { MatchService } from './match.service';
import { Profile } from '../../common/entities/profile.entity';
import { RarityEnum } from '../profile/enums/rarity.enum';
import { RelationshipTypeEnum } from '../profile/enums';
import { UserCardDto } from '../../common/dto/user-card.dto';
import { UserRepository } from '../../common/repository/user.repository';
import { mapProfileToCard } from '../../common/utils/card-utils';

@Injectable()
export class BoosterService {
  private readonly logger = new Logger(BoosterService.name);

  public constructor(
    private readonly matchService: MatchService,
    private readonly boosterRepository: BoosterRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly userRepository: UserRepository,
  ) {}

  public async openBooster(
    amount: number,
    req: HttpRequestDto,
    type?: RelationshipTypeEnum,
  ): Promise<UserCardDto[]> {
    const user = req.user;
    if (!user) {
      this.logger.error('User not found in getBooster');
      throw new NotFoundException('User not found');
    }

    this.logger.log('Getting booster', {
      userId: user.userId,
      amount,
      type: type,
    });

    // Find the current user to get their ID for tracking
    const currentUser = await this.userRepository.findUserWithProfile(
      user.userId,
    );

    // Track booster usage - using a default booster pack ID of 1 for now
    // In a real implementation, you'd determine which booster pack is being opened
    const boosterPackId = type
      ? this.getBoosterPackIdByType(type)
      : RelationshipTypeEnum.ANY;
    await this.analyticsService.trackBoosterUsage(
      currentUser?.user_id ?? '',
      boosterPackId,
    );

    const profiles = await this.matchService.findMatchesForUser(
      user.userId,
      amount,
      type,
    );

    if (profiles.length >= amount) {
      // We have enough matches
      this.logger.log('Found sufficient matches', {
        userId: user.userId,
        foundCount: profiles.length,
        requestedAmount: amount,
      });
      await this.matchService.createMatches(profiles, user.userId);
      return profiles.map(mapProfileToCard);
    }

    // We need more matches
    this.logger.log('Need more matches, finding additional profiles', {
      userId: user.userId,
      foundCount: profiles.length,
      requestedAmount: amount,
    });
    const finalProfiles: (Profile & { rarity: RarityEnum })[] = [...profiles];

    const additionalProfiles = await this.matchService.findBroadMatches(
      user.userId,
      profiles.map((p) => p.id),
      amount - profiles.length,
    );
    finalProfiles.push(...additionalProfiles);

    if (finalProfiles.length < amount) {
      // panic mode
      this.logger.warn('Entering panic mode for matches', {
        userId: user.userId,
        foundCount: finalProfiles.length,
        requestedAmount: amount,
      });
      const moreProfiles = await this.matchService.findBroadMatches(
        user.userId,
        profiles.map((p) => p.id),
        amount - finalProfiles.length,
        false, // don't exclude seen profiles
      );
      finalProfiles.push(...moreProfiles);
    }

    this.logger.log('Booster completed', {
      userId: user.userId,
      finalCount: finalProfiles.length,
      requestedAmount: amount,
    });
    await this.matchService.createMatches(finalProfiles, user.userId);
    return finalProfiles.map(mapProfileToCard);
  }

  public async getAvailablePacks() {
    this.logger.log('Fetching available packs');
    const packs = await this.boosterRepository.getAvailablePacks();
    this.logger.log('Available packs fetched', { packCount: packs.length });
    return packs;
  }

  public async createBooster(
    req: HttpRequestDto,
    body: CreateBoosterDto,
  ): Promise<void> {
    this.logger.log('Creating booster', {
      userId: req.user.userId,
      isAdmin: req.user.groups?.includes('admin'),
    });

    const user = req.user;
    if (!user.groups.includes('admin')) {
      this.logger.error('Non-admin user attempted to create booster', {
        userId: user.userId,
      });
      throw new NotFoundException('User not found or not admin');
    }

    await this.boosterRepository.createBooster(body);
    this.logger.log('Booster created successfully', {
      userId: user.userId,
      body,
    });
  }

  /**
   * Helper method to map relationship types to booster pack IDs
   * This is a simplified implementation - you'd want to maintain this mapping in the database
   */
  private getBoosterPackIdByType(type: RelationshipTypeEnum): number {
    switch (type) {
      case RelationshipTypeEnum.CASUAL:
        return 1;
      case RelationshipTypeEnum.LONG_TERM:
        return 2;
      case RelationshipTypeEnum.MARRIAGE:
        return 3;
      case RelationshipTypeEnum.FRIENDSHIP:
        return 4;
      case RelationshipTypeEnum.UNSURE:
        return 5;
      default:
        return 1;
    }
  }
}

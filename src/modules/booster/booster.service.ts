import { Injectable, NotFoundException } from '@nestjs/common';

import { AvailablePackDto } from './dto/available-pack.dto';
import { BoosterRepository } from '../../common/repository/booster.repository';
import { CreateBoosterDto } from './dto/create-booster.dto';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { MatchService } from './match.service';
import { Profile } from '../../common/entities/profile.entity';
import { RelationshipTypeEnum } from '../profile/enums';

@Injectable()
export class BoosterService {
  public constructor(
    private readonly matchService: MatchService,
    private readonly boosterRepository: BoosterRepository,
  ) {}

  public async getBooster(
    amount: number,
    req: HttpRequestDto,
    type?: RelationshipTypeEnum,
  ) {
    const user = req.user;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profiles = await this.matchService.findMatchesForUser(
      user.userId,
      amount,
      type,
    );

    if (profiles.length >= amount) {
      // We have enough matches
      await this.matchService.createMatches(profiles, user.userId);
      return profiles;
    }

    // We need more matches
    const finalProfiles: Profile[] = [...profiles];

    const additionalProfiles = await this.matchService.findBroadMatches(
      user.userId,
      profiles.map((p) => p.id),
      10 - profiles.length,
    );
    finalProfiles.push(...additionalProfiles);

    if (finalProfiles.length < 10) {
      // panic mode
      const moreProfiles = await this.matchService.findBroadMatches(
        user.userId,
        profiles.map((p) => p.id),
        10 - finalProfiles.length,
        false, // don't exclude seen profiles
      );
      finalProfiles.push(...moreProfiles);
    }

    await this.matchService.createMatches(finalProfiles, user.userId);
    return finalProfiles;
  }

  public async getAvailablePacks(): Promise<AvailablePackDto> {
    return this.boosterRepository.getAvailablePacks();
  }

  public async createBooster(
    req: HttpRequestDto,
    body: CreateBoosterDto,
  ): Promise<void> {
    const user = req.user;
    if (!user.groups.includes('admin')) {
      throw new NotFoundException('User not found or not admin');
    }

    await this.boosterRepository.createBooster(body);
  }
}

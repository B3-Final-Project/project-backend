import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { MatchService } from './match.service';
import { Profile } from '../../common/entities/profile.entity';
import { RelationshipTypeEnum } from '../profile/enums';
import { AvailablePackDto } from './dto/available-pack.dto';
import { BoosterRepository } from '../../common/repository/booster.repository';
import { CreateBoosterDto } from './dto/create-booster.dto';
import { mapProfileToCard } from '../../common/utils/card-utils';

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

    const extraProfiles: Profile[] = profiles;

    if (profiles.length < amount) {
      extraProfiles.push(
        ...(await this.matchService.findBroadMatches(
          user.userId,
          profiles.map((p) => p.id),
          10 - extraProfiles.length,
        )),
      );
    }

    if (extraProfiles.length < amount) {
      // panic mode
      extraProfiles.push(
        ...(await this.matchService.findBroadMatches(
          user.userId,
          profiles.map((p) => p.id),
          10 - extraProfiles.length,
          false, // don't exclude seen profiles
        )),
      );
    }

    await this.matchService.createMatches(profiles, user.userId);

    return profiles.map(mapProfileToCard);
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { MatchService } from './match.service';

@Injectable()
export class BoosterService {
  public constructor(private readonly matchService: MatchService) {}

  public async getBooster(amount: string, req: HttpRequestDto) {
    const parsedAmount = parseInt(amount, 10);
    const user = req.user;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profiles = await this.matchService.findMatchesForUser(
      user.userId,
      parsedAmount,
    );

    if (profiles.length < parsedAmount) {
      const extraProfiles = await this.matchService.findBroadMatches(
        user.userId,
        profiles.map((p) => p.id),
        10 - profiles.length,
      );
      profiles.push(...extraProfiles);
    }

    await this.matchService.createMatches(profiles, user.userId);

    return profiles;
  }
}

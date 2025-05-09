import { Injectable } from '@nestjs/common';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { MatchService } from './match.service';

@Injectable()
export class BoosterService {
  public constructor(private readonly matchService: MatchService) {}

  public async getBooster(amount: string, req: HttpRequestDto) {
    const user = req.user;
    if (!user) {
      throw new Error('User not found');
    }

    const profiles = await this.matchService.findMatchesForUser(
      user.userId,
      10,
    );

    if (profiles.length < 10) {
      const extraProfiles = await this.matchService.findBroadMatches(
        user.userId,
        10 - profiles.length,
      );
      return [...profiles, ...extraProfiles];
    }

    return profiles;
  }
}

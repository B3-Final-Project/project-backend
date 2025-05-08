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

    return await this.matchService.findMatchesForUser(user.userId, 10);
  }
}

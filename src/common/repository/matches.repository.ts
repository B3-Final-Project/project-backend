import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMatches } from '../entities/user-matches.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchRepository {
  public constructor(
    @InjectRepository(UserMatches)
    private readonly userMatches: Repository<UserMatches>,
  ) {}

  public async getSeenRows(userId: string) {
    const seenRows = await this.userMatches.find({
      where: { user_id: userId },
    });

    return seenRows.map((row) => row.profile_id);
  }

  public async save(matches: UserMatches[]) {
    return await this.userMatches.save(matches);
  }
}

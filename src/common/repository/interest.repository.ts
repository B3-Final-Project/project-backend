import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interest } from '../entities/interest.entity';
import { InterestItem } from '../../modules/profile/dto/update-profile.dto';

@Injectable()
export class InterestRepository {
  public constructor(
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
  ) {}

  public async save(items: InterestItem[]): Promise<Interest[]> {
    const interests = items.map((item) =>
      this.interestRepository.create({
        prompt: item.prompt,
        answer: item.answer,
      }),
    );

    return await this.interestRepository.save(interests);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Interest } from '../entities/interest.entity';

@Injectable()
export class InterestRepository {
  public constructor(
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
  ) {}

  public async saveNewInterests(
    items: Array<{ prompt: string; answer: string }>,
  ): Promise<Interest[]> {
    const interests = items.map((item) =>
      this.interestRepository.create({
        prompt: item.prompt,
        answer: item.answer,
      }),
    );

    return await this.interestRepository.save(interests);
  }

  public async findByIds(ids: number[]): Promise<Interest[]> {
    return await this.interestRepository.find({
      where: { id: In(ids) },
    });
  }

  public async findAll(): Promise<Interest[]> {
    return await this.interestRepository.find();
  }
}

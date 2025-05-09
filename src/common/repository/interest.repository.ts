import { InjectRepository } from '@nestjs/typeorm';
import { Interest } from '../entities/interest.entity';
import { In, Repository } from 'typeorm';

export class InterestRepository {
  public constructor(
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
  ) {}

  public async saveNewInterest(interestDescriptions: string[]) {
    const existing = await this.interestRepository.find({
      where: { description: In(interestDescriptions) },
    });
    const existingSet = new Set(existing.map((i) => i.description));

    const toCreate = interestDescriptions
      .filter((d) => !existingSet.has(d))
      .map((d) => this.interestRepository.create({ description: d }));

    // save all and reassign
    const savedNew = await this.interestRepository.save(toCreate);

    return [...existing, ...savedNew];
  }
}

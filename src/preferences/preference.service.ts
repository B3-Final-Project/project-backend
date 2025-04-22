import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { Preference } from '../common/entities/preference.entity';
import { Interest } from '../common/entities/interest.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class PreferenceService {
  constructor(
    @InjectRepository(Preference)
    private readonly preferenceRepository: Repository<Preference>,

    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
  ) {}

  async updatePreference(
    preferenceDto: UpdatePreferenceDto,
    userId: string,
  ): Promise<Preference> {
    const preference = await this.findUserPreferenceOrThrow(userId, [
      'interests',
    ]);
    const updatedPreference = this.mapPreference(preferenceDto, preference);
    return this.preferenceRepository.save(updatedPreference);
  }

  async updatePreferenceInterests(
    userId: string,
    interestDescriptions: string[],
  ): Promise<Preference> {
    const preference = await this.findUserPreferenceOrThrow(userId);

    const existingInterests = await this.interestRepository.find({
      where: { description: In(interestDescriptions) },
    });

    const existingDescriptions = new Set(
      existingInterests.map((i) => i.description),
    );

    const newInterests = interestDescriptions
      .filter((desc) => !existingDescriptions.has(desc))
      .map((desc) => this.interestRepository.create({ description: desc }));

    preference.interests = await this.interestRepository.save([
      ...existingInterests,
      ...newInterests,
    ]);
    return this.preferenceRepository.save(preference);
  }

  async getPreferences(req: HttpRequestDto): Promise<Preference[]> {
    return this.preferenceRepository.find({
      where: { user_id: req.user.userId },
      relations: ['interests'],
    });
  }

  async getAllPreferences(): Promise<Preference[]> {
    return this.preferenceRepository.find({ relations: ['interests'] });
  }

  async createPreference(
    preferenceDto: UpdatePreferenceDto,
  ): Promise<Preference> {
    const preference = this.mapPreference(preferenceDto);
    return this.preferenceRepository.save(preference);
  }

  private mapPreference(
    dto: UpdatePreferenceDto,
    entity = new Preference(),
  ): Preference {
    const {
      personalInfo,
      locationWork,
      preferenceInfo,
      lifestyleInfo,
      userId,
    } = dto;

    if (personalInfo) {
      Object.assign(entity, personalInfo);
    }

    if (locationWork) {
      Object.assign(entity, locationWork);
    }

    if (preferenceInfo) {
      Object.assign(entity, preferenceInfo);
    }

    if (lifestyleInfo) {
      Object.assign(entity, lifestyleInfo);
    }

    if (userId) {
      entity.user_id = userId;
    }

    return entity;
  }

  private async findUserPreferenceOrThrow(
    userId: string,
    relations: string[] = [],
  ): Promise<Preference> {
    const preference = await this.preferenceRepository.findOne({
      where: { user_id: userId },
      relations,
    });

    if (!preference) {
      throw new NotFoundException(`Preference for user ${userId} not found`);
    }

    return preference;
  }
}

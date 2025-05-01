import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { Profile } from '../common/entities/profile.entity';
import { Interest } from '../common/entities/interest.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly preferenceRepository: Repository<Profile>,

    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
  ) {}

  async updateProfile(
    preferenceDto: UpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    const userId = req.user.userId;
    const profile = await this.findUserProfileOrThrow(userId, ['interests']);
    const updatedProfile = this.mapProfile(preferenceDto, profile);
    return this.preferenceRepository.save(updatedProfile);
  }

  async updateProfileInterests(
    userId: string,
    interestDescriptions: string[],
  ): Promise<Profile> {
    const profile = await this.findUserProfileOrThrow(userId);

    const existingInterests = await this.interestRepository.find({
      where: { description: In(interestDescriptions) },
    });

    const existingDescriptions = new Set(
      existingInterests.map((i) => i.description),
    );

    const newInterests = interestDescriptions
      .filter((desc) => !existingDescriptions.has(desc))
      .map((desc) => this.interestRepository.create({ description: desc }));

    profile.interests = await this.interestRepository.save([
      ...existingInterests,
      ...newInterests,
    ]);
    return this.preferenceRepository.save(profile);
  }

  async getProfiles(req: HttpRequestDto): Promise<Profile> {
    return this.preferenceRepository.findOne({
      where: { user_id: req.user.userId },
      relations: ['interests'],
    });
  }

  async getAllProfiles(): Promise<Profile[]> {
    return this.preferenceRepository.find({ relations: ['interests'] });
  }

  async createProfile(
    preferenceDto: UpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    const userId = req.user.userId;
    const profile = this.mapProfile({ ...preferenceDto, userId });
    return this.preferenceRepository.save(profile);
  }

  private mapProfile(dto: UpdateProfileDto, entity = new Profile()): Profile {
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

  private async findUserProfileOrThrow(
    userId: string,
    relations: string[] = [],
  ): Promise<Profile> {
    const profile = await this.preferenceRepository.findOne({
      where: { user_id: userId },
      relations,
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return profile;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { HttpRequestDto } from '../common/dto/http-request.dto';
import { Profile } from '../common/entities/profile.entity';
import { Interest } from '../common/entities/interest.entity';
import {
  UpdateProfileDto,
  PartialUpdateProfileDto,
} from './dto/update-profile.dto';
import { User } from '../common/entities/user.entity';
import { ProfileUtils } from './profile-utils.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
  ) {}

  async updateProfile(
    dto: UpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    const profile = await this.findProfileOrThrowByUserId(req.user.userId, [
      'interests',
    ]);

    const updated = ProfileUtils.mapProfile(dto, profile);
    return this.profileRepository.save(updated);
  }

  private async updatePartialProfile<K extends keyof PartialUpdateProfileDto>(
    section: K,
    dto: PartialUpdateProfileDto[K],
    req: HttpRequestDto,
  ): Promise<Profile> {
    const profile = await this.findProfileOrThrowByUserId(req.user.userId, [
      'interests',
    ]);
    // Dynamically map only the provided section
    const updated = ProfileUtils.mapProfile(
      { [section]: dto } as PartialUpdateProfileDto,
      profile,
    );
    return this.profileRepository.save(updated);
  }

  /** Replace the authenticated user’s interests */
  async updateProfileInterests(
    userId: string,
    interestDescriptions: string[],
  ): Promise<Profile> {
    const profile = await this.findProfileOrThrowByUserId(userId, [
      'interests',
    ]);

    // fetch existing, create the rest
    const existing = await this.interestRepository.find({
      where: { description: In(interestDescriptions) },
    });
    const existingSet = new Set(existing.map((i) => i.description));

    const toCreate = interestDescriptions
      .filter((d) => !existingSet.has(d))
      .map((d) => this.interestRepository.create({ description: d }));

    // save all and reassign
    const savedNew = await this.interestRepository.save(toCreate);
    profile.interests = [...existing, ...savedNew];

    return this.profileRepository.save(profile);
  }

  async getProfile(req: HttpRequestDto): Promise<any> {
    const profile = await this.findProfileOrThrowByUserId(req.user.userId, [
      'interests',
    ]);

    const user = await this.userRepository.findOne({
      where: { user_id: req.user.userId },
    });

    profile.userProfile = undefined;
    return {
      profile,
      user,
    };
  }

  async getAllProfiles(): Promise<Profile[]> {
    return this.profileRepository.find({
      relations: ['interests', 'userProfile'],
    });
  }

  async createProfile(
    dto: UpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    // 1) Create the bare Profile
    const profileEntity = ProfileUtils.mapProfile(dto, new Profile());
    const savedProfile = await this.profileRepository.save(profileEntity);

    let user = await this.userRepository.findOne({
      where: { user_id: req.user.userId },
    });

    const { personalInfo } = dto;
    if (!user) {
      user = this.userRepository.create({
        user_id: req.user.userId,
        name: personalInfo.name,
        surname: personalInfo.surname,
        gender: personalInfo.gender,
        age: personalInfo.age,
        profile: savedProfile,
      });
    } else {
      // 4) If it already existed, update their “personalInfo” and attach the new Profile
      Object.assign(user, {
        name: personalInfo.name,
        surname: personalInfo.surname,
        gender: personalInfo.gender,
        age: personalInfo.age,
      });
      user.profile = savedProfile;
    }

    await this.userRepository.save(user);
    return savedProfile;
  }

  /**
   * Patch a single section of the authenticated user's profile
   */
  public async updateProfileField(
    body: PartialUpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    if (!body || Object.keys(body).length === 0) {
      throw new BadRequestException('No data provided for patch');
    }

    const sections = [
      'personalInfo',
      'preferenceInfo',
      'locationWork',
      'lifestyleInfo',
    ] as const;
    const providedSections = sections.filter(
      (section) => body[section] !== undefined,
    );

    if (providedSections.length === 0) {
      throw new BadRequestException(
        'No valid profile section provided to patch',
      );
    }
    if (providedSections.length > 1) {
      throw new BadRequestException(
        'Please provide exactly one profile section per patch request',
      );
    }

    // Only one section is provided
    const section = providedSections[0];
    const dto = body[section]!;

    return this.updatePartialProfile(section, dto, req);
  }

  private async findProfileOrThrowByUserId(
    userId: string,
    relations: string[] = [],
  ): Promise<Profile> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
    });
    if (!user || !user.profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    if (relations.length === 0) {
      return user.profile;
    }

    const profile = await this.profileRepository.findOne({
      where: { id: user.profile.id },
      relations,
    });
    if (!profile) {
      throw new NotFoundException(`Profile #${user.profile.id} disappeared`);
    }
    return profile;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { HttpRequestDto } from '../common/dto/http-request.dto';
import { Profile } from '../common/entities/profile.entity';
import { Interest } from '../common/entities/interest.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../common/entities/user.entity';

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

    const updated = this.mapProfile(dto, profile);
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
      'userProfile',
    ]);

    return {
      name: profile.userProfile.name,
      surname: profile.userProfile.surname,
      gender: profile.userProfile.gender,
      orientation: profile.orientation,
      city: profile.city,
      work: profile.work,
      languages: profile.languages,
      min_age: profile.min_age,
      max_age: profile.max_age,
      max_distance: profile.max_distance,
      relationship_type: profile.relationship_type,
      smoking: profile.smoking,
      drinking: profile.drinking,
      religion: profile.religion,
      politics: profile.politics,
      zodiac: profile.zodiac,
      interests: profile.interests,
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
    const profileEntity = this.mapProfile(dto, new Profile());
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

        // you can set defaults here or pick more fields from dto…
        profile: savedProfile,
      });
    } else {
      // 4) If it already existed, update their “personalInfo” and attach the new Profile
      Object.assign(user, {
        name: personalInfo.name,
        surname: personalInfo.surname,
        gender: personalInfo.gender,
        age: 23,
      });
      user.profile = savedProfile;
    }

    // 5) Persist the User (with its new profile_id FK)
    await this.userRepository.save(user);

    return savedProfile;
  }

  private async findProfileOrThrowByUserId(
    userId: string,
    relations: string[] = [],
  ): Promise<Profile> {
    // fetch the user + its profile
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

    // reload with extra joins
    const profile = await this.profileRepository.findOne({
      where: { id: user.profile.id },
      relations,
    });
    if (!profile) {
      // should never happen, but just in case
      throw new NotFoundException(`Profile #${user.profile.id} disappeared`);
    }
    return profile;
  }

  private mapProfile(dto: UpdateProfileDto, entity: Profile): Profile {
    const { locationWork, preferenceInfo, lifestyleInfo } = dto;

    if (locationWork) {
      Object.assign(entity, locationWork);
    }

    if (preferenceInfo) {
      Object.assign(entity, preferenceInfo);
    }

    if (lifestyleInfo) {
      Object.assign(entity, lifestyleInfo);
    }

    return entity;
  }
}

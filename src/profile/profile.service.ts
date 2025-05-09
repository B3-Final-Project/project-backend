import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpRequestDto } from '../common/dto/http-request.dto';
import { Profile } from '../common/entities/profile.entity';
import {
  PartialUpdateProfileDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';
import { User } from '../common/entities/user.entity';
import { ProfileUtils } from './profile-utils.service';
import { UserRepository } from '../common/repository/user.repository';
import { ProfileRepository } from '../common/repository/profile.repository';
import { InterestRepository } from '../common/repository/interest.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly userRepository: UserRepository,
    private readonly interestRepository: InterestRepository,
  ) {}

  async updateProfile(
    dto: UpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    const profile = await this.userRepository.findProfileOrThrowByUserId(
      req.user.userId,
      ['interests'],
    );

    const updated = ProfileUtils.mapProfile(dto, profile);
    return this.profileRepository.save(updated);
  }

  private async updatePartialProfile<K extends keyof PartialUpdateProfileDto>(
    section: K,
    dto: PartialUpdateProfileDto[K],
    req: HttpRequestDto,
  ): Promise<Profile> {
    const profile = await this.userRepository.findProfileOrThrowByUserId(
      req.user.userId,
      ['interests'],
    );
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
    const profile = await this.userRepository.findProfileOrThrowByUserId(
      userId,
      ['interests'],
    );

    // fetch existing, create the rest

    profile.interests =
      await this.interestRepository.saveNewInterest(interestDescriptions);

    return this.profileRepository.save(profile);
  }

  async getProfile(req: HttpRequestDto): Promise<any> {
    const profile = await this.userRepository.findProfileOrThrowByUserId(
      req.user.userId,
      ['interests'],
    );

    const user = await this.userRepository.findById(req.user.userId);

    profile.userProfile = undefined;
    return {
      profile,
      user,
    };
  }

  async createProfile(
    dto: UpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    // 1) Create the bare Profile
    const profileEntity = ProfileUtils.mapProfile(dto, new Profile());
    const savedProfile = await this.profileRepository.save(profileEntity);

    let user = await this.userRepository.findById(req.user.userId);

    const { personalInfo } = dto;
    if (!user) {
      user = await this.userRepository.create({
        user_id: req.user.userId,
        name: personalInfo.name,
        surname: personalInfo.surname,
        gender: personalInfo.gender,
        age: personalInfo.age,
        profile: savedProfile,
      } as User);
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

    // 5) Persist the User (with its new profile_id FK)
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
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  PartialUpdateProfileDto,
  UpdateProfileDto,
} from '../dto/update-profile.dto';

import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { InterestRepository } from '../../common/repository/interest.repository';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { ProfileUtils } from './profile-utils.service';
import { User } from '../../common/entities/user.entity';
import { UserRepository } from '../../common/repository/user.repository';
import { S3Service } from './s3.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(S3Service.name);
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly userRepository: UserRepository,
    private readonly interestRepository: InterestRepository,
    private readonly s3Service: S3Service,
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
      user = this.userRepository.create({
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

  public async uploadImage(
    file: Express.MulterS3.File,
    req: HttpRequestDto,
    index: number,
  ): Promise<{ images: string[] }> {
    if (index < 0 || index >= 6) {
      throw new BadRequestException('Image index must be between 0 and 5');
    }

    const userId = req.user.userId;
    const profile = await this.profileRepository.findByUserId(userId);

    // If there's already an image at this index, delete the old one from S3
    if (profile.images && profile.images[index]) {
      const oldImageUrl = profile.images[index];
      const oldImageKey = this.s3Service.extractKeyFromUrl(oldImageUrl);

      if (oldImageKey) {
        // Delete old image from S3 (don't wait for it, do it async)
        this.s3Service.deleteObject(oldImageKey).catch((error) => {
          this.logger.error(
            `Failed to delete old image ${oldImageKey}:`,
            error,
          );
        });
      }
    }

    // Save the new image URL
    const result = await this.profileRepository.saveImageUrl(
      profile,
      file.location,
      index,
    );

    this.logger.log(
      `Image uploaded for user ${userId} at index ${index}: ${file.location}`,
    );
    return result;
  }

  public async removeImage(
    req: HttpRequestDto,
    index: number,
  ): Promise<{ images: string[] }> {
    const userId = req.user.userId;

    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile.images || !profile.images[index]) {
      throw new BadRequestException(`No image found at index ${index}`);
    }
    const oldImageUrl = profile.images[index];
    const oldImageKey = this.s3Service.extractKeyFromUrl(oldImageUrl);
    if (oldImageKey) {
      this.s3Service.deleteObject(oldImageKey).catch((error) => {
        this.logger.error(`Failed to delete old image ${oldImageKey}:`, error);
      });
    }
    profile.images[index] = null; // Remove the image by setting it to null
    await this.profileRepository.save(profile);

    return { images: profile.images };
  }
}

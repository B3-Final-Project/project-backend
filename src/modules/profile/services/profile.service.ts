import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  InterestInfo,
  PartialUpdateProfileDto,
  UpdateProfileDto,
} from '../dto/update-profile.dto';
import {
  UserManagementDto,
  UserManagementResponseDto,
} from '../dto/user-management.dto';

import { HttpRequestDto } from '../../../common/dto/http-request.dto';
import { InterestRepository } from '../../../common/repository/interest.repository';
import { Profile } from '../../../common/entities/profile.entity';
import { ProfileRepository } from '../../../common/repository/profile.repository';
import { ProfileUtils } from './profile-utils.service';
import { S3Service } from './s3.service';
import { User } from '../../../common/entities/user.entity';
import { UserRepository } from '../../../common/repository/user.repository';
import { BanUserResponseDto } from '../dto/admin-actions.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
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

    // Handle interests if provided
    if (dto.interestInfo?.interests && dto.interestInfo.interests.length > 0) {
      // Create Interest entities from the interestInfo
      const interestItems = ProfileUtils.extractInterestItems(dto);
      updated.interests = await this.interestRepository.save(interestItems);
    }

    const savedProfile = await this.profileRepository.save(updated);
    this.logger.log('updated profile', { profile_id: profile.id });
    return savedProfile;
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

    // Handle interestInfo section specially
    if (section === 'interestInfo') {
      const interestInfo = dto as InterestInfo;
      if (interestInfo.interests.length > 0) {
        profile.interests = await this.interestRepository.save(
          interestInfo.interests,
        );
      }

      return this.profileRepository.save(profile);
    }

    // Dynamically map only the provided section for other sections
    const updated = ProfileUtils.mapProfile(
      { [section]: dto } as PartialUpdateProfileDto,
      profile,
    );
    const savedProfile = this.profileRepository.save(updated);
    this.logger.log(`updated profile section`, {
      profile_id: profile.id,
      payload: dto,
    });
    return savedProfile;
  }

  /** Replace the authenticated user's interests */
  async updateProfileInterests(
    userId: string,
    interestItems: Array<{ prompt: string; answer: string }>,
  ): Promise<Profile> {
    const profile = await this.userRepository.findProfileOrThrowByUserId(
      userId,
      ['interests'],
    );

    profile.interests = await this.interestRepository.save(interestItems);

    this.logger.log('saved interests', { interests: profile.interests });
    return this.profileRepository.save(profile);
  }

  async getProfile(
    req: HttpRequestDto,
  ): Promise<{ profile: Profile; user: User } | null> {
    let profile: Profile;
    try {
      profile = await this.userRepository.findProfileOrThrowByUserId(
        req.user.userId,
        ['interests'],
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error; // Re-throw unexpected errors
    }
    const user = await this.userRepository.findById(req.user.userId);

    profile.userProfile = undefined;
    return {
      profile,
      user,
    };
  }

  async getProfileById(id: string): Promise<{ profile: Profile; user: User }> {
    // returns a profile by its ID with optional extra relations
    const profile = await this.profileRepository.findByUserId(id, [
      'interests',
      'userProfile',
    ]);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    this.logger.log(`Retrieved profile by ID`, { profileId: id });
    return {
      profile,
      user: profile.userProfile,
    };
  }

  async getAllProfiles(
    offset = 0,
    limit = 10,
    sortBy?: 'reportCount' | 'createdAt',
    sortOrder?: 'asc' | 'desc',
  ): Promise<UserManagementResponseDto> {
    // returns a list of all profiles with user information and count
    const profiles = await this.profileRepository.getAllProfiles(
      offset,
      limit,
      sortBy,
      sortOrder,
    );
    const mappedProfiles = profiles.map((profile) => {
      const user = profile.userProfile;
      return {
        id: profile.id,
        userId: user.user_id,
        name: user.name,
        surname: user.surname,
        profileId: profile.id,
        reportCount: profile.reportCount,
        createdAt: profile.created_at,
        isBanned: user.banned,
      } as UserManagementDto;
    });

    this.logger.log('Retrieved all profiles', {
      count: mappedProfiles.length,
    });

    return {
      profiles: mappedProfiles,
      totalCount: mappedProfiles.length,
    };
  }

  async createProfile(
    dto: UpdateProfileDto,
    req: HttpRequestDto,
  ): Promise<Profile> {
    // 1) Create the bare Profile
    const profileEntity = ProfileUtils.mapProfile(dto, new Profile());

    // Handle interests if provided
    if (dto.interestInfo?.interests && dto.interestInfo.interests.length > 0) {
      // Create Interest entities from the interestInfo
      const interestItems = ProfileUtils.extractInterestItems(dto);
      profileEntity.interests =
        await this.interestRepository.save(interestItems);
    }

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
      // 4) If it already existed, update their "personalInfo" and attach the new Profile
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
    this.logger.log('profile was created', { profile_id: savedProfile.id });

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
      'interestInfo',
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
    const dto = body[section];

    const profile = this.updatePartialProfile(section, dto, req);
    this.logger.log(`Profile section updated`, {
      section,
      userId: req.user.userId,
      payload: dto,
    });
    return profile;
  }

  public async getMatchedProfiles(req: HttpRequestDto): Promise<Profile[]> {
    const userId = req.user.userId;

    // Get the current user's profile ID
    const currentUser = await this.userRepository.findUserWithProfile(userId);
    const profileId = currentUser.profile.id;

    return this.profileRepository.findMatchedProfiles(profileId);
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
    if (profile.images?.[index]) {
      const oldImageUrl = profile.images[index];
      const oldImageKey = this.s3Service.extractKeyFromUrl(oldImageUrl);

      if (oldImageKey) {
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
    if (!profile.images?.[index]) {
      throw new BadRequestException(`No image found at index ${index}`);
    }
    const oldImageUrl = profile.images[index];
    const oldImageKey = this.s3Service.extractKeyFromUrl(oldImageUrl);
    // If there's an old image, delete it from S3 using the key extracted from the URL
    if (oldImageKey) {
      this.s3Service.deleteObject(oldImageKey).catch((error) => {
        this.logger.error(`Failed to delete old image ${oldImageKey}:`, error);
      });
    }
    // Remove the image from the profile
    profile.images.splice(index, 1);

    await this.profileRepository.save(profile);

    return { images: profile.images };
  }

  async reportUser(
    reportedUserId: string,
    reporterUserId: string,
  ): Promise<{ message: string; reportCount: number }> {
    // Find the reported user's profile
    const reportedProfile =
      await this.profileRepository.findByUserId(reportedUserId);

    if (!reportedProfile) {
      throw new NotFoundException(`User with ID ${reportedUserId} not found`);
    }

    // Increment the report count
    await this.profileRepository.incrementReportCount(reportedProfile.id);

    // Get updated profile to return current report count
    const updatedProfile = await this.profileRepository.findByProfileId(
      reportedProfile.id,
    );

    this.logger.log(`User reported`, {
      reportedUserId,
      reporterUserId,
      newReportCount: updatedProfile.reportCount,
    });

    // Auto-ban if report count exceeds threshold
    if (updatedProfile.reportCount >= 5) {
      await this.banUser(reportedUserId);
      return {
        message: `User reported successfully. User has been automatically banned due to ${updatedProfile.reportCount} reports.`,
        reportCount: updatedProfile.reportCount,
      };
    }

    return {
      message: 'User reported successfully',
      reportCount: updatedProfile.reportCount,
    };
  }

  async banUser(userId: string): Promise<BanUserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.banned) {
      return { success: true, message: 'User is already banned' };
    }

    user.banned = true;
    await this.userRepository.save(user);

    this.logger.log(`User banned`, { userId });

    return { success: true, message: 'User banned successfully' };
  }

  async unbanUser(userId: string): Promise<BanUserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.banned) {
      return { success: true, message: 'User is not banned' };
    }

    user.banned = false;
    await this.userRepository.save(user);

    this.logger.log(`User unbanned`, { userId });

    return { success: true, message: 'User unbanned successfully' };
  }
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ImageResponseDto } from './dto/image-response.dto';

import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { S3Service } from '../profile/services/s3.service';

@Injectable()
export class ProfileImagesService {
  private readonly logger = new Logger(ProfileImagesService.name);
  constructor(
    private readonly s3Service: S3Service,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async uploadImage(
    profileId: number,
    file: Express.MulterS3.File,
    req: HttpRequestDto,
  ): Promise<ImageResponseDto> {
    // Validate user owns the profile
    const userId = req.user.userId;
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile || profile.id !== profileId) {
      throw new BadRequestException('Profile not found or not owned by user');
    }

    // Save the new image URL in DB
    await this.profileRepository.saveImageUrl(profile, file.location);
    this.logger.log(`Image uploaded for user ${userId}: ${file.location}`);
    return;
  }

  async replaceImage(
    profileId: number,
    index: number,
    file: Express.MulterS3.File,
    req: HttpRequestDto,
  ): Promise<ImageResponseDto> {
    if (index < 0 || index > 5) {
      throw new BadRequestException('Image index must be between 0 and 5');
    }
    // Validate user owns the profile
    const userId = req.user.userId;
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile || profile.id !== profileId) {
      throw new BadRequestException('Profile not found or not owned by user');
    }
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
    // Save the new image URL in DB
    await this.profileRepository.saveImageUrl(profile, file.location, index);
    this.logger.log(
      `Image uploaded for user ${userId} at index ${index}: ${file.location}`,
    );
    return;
  }

  async deleteImage(
    profileId: number,
    index: number,
    req: HttpRequestDto,
  ): Promise<{ message: string }> {
    if (index === undefined || index < 0) {
      throw new BadRequestException('Image not found in profile');
    }
    // Validate user owns the profile
    const userId = req.user.userId;
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile || profile.id !== profileId) {
      throw new BadRequestException('Profile not found or not owned by user');
    }

    // Delete the image from S3
    const imageUrl = profile.images[index];

    const imageKey = this.s3Service.extractKeyFromUrl(imageUrl);
    if (imageKey) {
      await this.s3Service.deleteObject(imageKey);
    }
    // Remove the image from the profile
    profile.images.splice(index, 1);
    await this.profileRepository.save(profile);
    return {
      message: `Image deleted successfully`,
    };
  }
}

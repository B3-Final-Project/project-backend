import { InterestItem, UpdateProfileDto } from '../dto/update-profile.dto';

import { BadRequestException } from '@nestjs/common';
import { Profile } from '../../../common/entities/profile.entity';
import { User } from '../../../common/entities/user.entity';

export class ProfileUtils {
  public static mapProfile(
    dto: Partial<UpdateProfileDto>,
    entity: Profile,
  ): Profile {
    const { locationWork, preferenceInfo, lifestyleInfo, personalInfo } = dto;

    if (locationWork) {
      entity.city = locationWork.city;
      entity.work = locationWork.work;
      entity.languages = locationWork.languages;
    }

    if (preferenceInfo) {
      entity.min_age = preferenceInfo.min_age;
      entity.max_age = preferenceInfo.max_age;
      entity.max_distance = preferenceInfo.max_distance;
      entity.relationship_type = preferenceInfo.relationship_type;
    }

    if (lifestyleInfo) {
      entity.smoking = lifestyleInfo.smoking;
      entity.drinking = lifestyleInfo.drinking;
      entity.religion = lifestyleInfo.religion;
      entity.politics = lifestyleInfo.politics;
      entity.zodiac = lifestyleInfo.zodiac;
    }

    if (personalInfo) {
      entity.orientation = personalInfo.orientation;
    }

    return entity;
  }

  public static mapUser(
    dto: Partial<UpdateProfileDto>,
    user: User | undefined | null,
  ): User | undefined {
    if (!user) return undefined;
    const { personalInfo } = dto;

    if (personalInfo) {
      user.name = personalInfo.name;
      user.surname = personalInfo.surname;
      user.age = personalInfo.age;
      user.gender = personalInfo.gender;
    }

    return user;
  }

  public static extractInterestItems(
    dto: Partial<UpdateProfileDto>,
  ): InterestItem[] {
    if (!dto.interestInfo?.interests) {
      return [];
    }

    // Extract the full interest items (prompt and answer)
    return dto.interestInfo.interests;
  }
}

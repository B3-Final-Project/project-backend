import { Profile } from '../../../common/entities/profile.entity';
import { InterestItem, UpdateProfileDto } from '../dto/update-profile.dto';

export class ProfileUtils {
  public static mapProfile(
    dto: Partial<UpdateProfileDto>,
    entity: Profile,
  ): Profile {
    const { locationWork, preferenceInfo, lifestyleInfo, personalInfo } = dto;

    if (locationWork) {
      Object.assign(entity, locationWork);
    }

    if (preferenceInfo) {
      Object.assign(entity, preferenceInfo);
    }

    if (lifestyleInfo) {
      Object.assign(entity, lifestyleInfo);
    }

    if (personalInfo) {
      Object.assign(entity, personalInfo);
    }

    return entity;
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

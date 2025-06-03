import { Profile } from '../../../common/entities/profile.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';

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

    // Map orientation from personalInfo to profile entity
    if (personalInfo?.orientation !== undefined) {
      entity.orientation = personalInfo.orientation;
    }

    return entity;
  }
}

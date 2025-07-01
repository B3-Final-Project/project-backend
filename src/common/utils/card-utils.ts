import { Profile } from '../entities/profile.entity';
import { RarityEnum } from '../../modules/profile/enums/rarity.enum';
import { UserCardDto } from '../dto/user-card.dto';

export function mapProfileToCard(
  profile: Profile & { rarity: RarityEnum },
): UserCardDto {
  return {
    id: profile.id,
    name: profile.userProfile?.name ?? '',
    age: profile.userProfile?.age ?? 0,
    city: profile.city ?? '',
    work: profile.work ?? '',
    images: profile.images ?? [],
    avatarUrl: profile.avatarUrl ?? profile.images?.[0] ?? '/vintage.png',
    languages: profile.languages ?? [],
    smoking: profile.smoking,
    drinking: profile.drinking,
    zodiac: profile.zodiac,
    interests: profile.interests ?? [],
    rarity: profile.rarity,
    surname: profile.userProfile?.surname ?? '',
    min_age: profile.min_age,
    max_age: profile.max_age,
    max_distance: profile.max_distance,
    orientation: profile.orientation,
    relationship_type: profile.relationship_type,
    religion: profile.religion,
    politics: profile.politics,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

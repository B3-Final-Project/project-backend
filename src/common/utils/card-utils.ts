import { Profile } from '../entities/profile.entity';
import { RarityEnum } from '../../modules/profile/enums/rarity.enum';
import { UserCardDto } from '../dto/user-card.dto';

export function mapProfileToCard(
  profile: Profile & { rarity: RarityEnum },
): UserCardDto {
  return {
    id: profile.id,
    name: profile.userProfile?.name || '',
    age: profile.userProfile?.age || 0,
    city: profile.city || '',
    work: profile.work || '',
    images: profile.images || [],
    languages: profile.languages || [],
    smoking: profile.smoking,
    drinking: profile.drinking,
    zodiac: profile.zodiac,
    interests: profile.interests || [],
    rarity: profile.rarity,
  };
}

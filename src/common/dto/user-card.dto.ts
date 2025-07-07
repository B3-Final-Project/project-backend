import {
  DrinkingEnum,
  SmokingEnum,
  ZodiacEnum,
} from '../../modules/profile/enums';

import { Interest } from '../entities/interest.entity';
import { RarityEnum } from '../../modules/profile/enums/rarity.enum';

export interface UserCardDto {
  id: number;
  name: string;
  age: number;
  city: string;
  work: string;
  images: string[];
  rarity: RarityEnum;
  interests: Interest[];
  languages?: string[];
  smoking?: SmokingEnum;
  drinking?: DrinkingEnum;
  zodiac?: ZodiacEnum;
  surname?: string;
  min_age?: number;
  max_age?: number;
  max_distance?: number;
  orientation?: number;
  relationship_type?: number;
  religion?: number;
  politics?: number;
  avatarUrl?: string;
  created_at?: Date; // Rendu optionnel car peut être absent
  updated_at?: Date; // Rendu optionnel car peut être absent
}

import { Interest } from '../entities/interest.entity';
import {
  DrinkingEnum,
  SmokingEnum,
  ZodiacEnum,
} from '../../modules/profile/enums';
import { RarityEnum } from '../../modules/profile/enums/rarity.enum';

export interface UserCardDto {
  id: number;
  name: string;
  age: number;
  city: string;
  work: string;
  images: string[];
  languages?: string[];
  smoking?: SmokingEnum;
  drinking?: DrinkingEnum;
  zodiac?: ZodiacEnum;
  interests?: Interest[];
  rarity: RarityEnum;
}

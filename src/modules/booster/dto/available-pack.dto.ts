import { ApiProperty } from '@nestjs/swagger';
import { BoosterPack } from '../../../common/entities/booster.entity';

export class AvailablePackDto {
  @ApiProperty({ type: [BoosterPack] })
  data: BoosterPack[];
}

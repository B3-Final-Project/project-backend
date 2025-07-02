import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { BoosterPack } from './booster.entity';
import { User } from './user.entity';

@Entity('booster_usage')
export class BoosterUsage {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for booster usage',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'uuid-123',
    description: 'User ID who used the booster',
  })
  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @ApiProperty({ example: 1, description: 'Booster pack ID that was used' })
  @Column({ type: 'int' })
  boosterPackId: number;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ type: () => BoosterPack })
  @ManyToOne(() => BoosterPack)
  @JoinColumn({ name: 'boosterPackId' })
  boosterPack: BoosterPack;

  @ApiProperty({ type: String })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  usedAt: Date;
}

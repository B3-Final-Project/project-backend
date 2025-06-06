import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RelationshipTypeEnum } from '../../modules/profile/enums';

@Entity()
export class BoosterPack {
  @PrimaryGeneratedColumn()
  id: string;
  @Column({ type: 'varchar', length: 255 })
  name: string;
  @Column({ type: 'varchar', length: 255 })
  imageUrl: string;
  @Column({ type: 'int' })
  type: RelationshipTypeEnum;
}

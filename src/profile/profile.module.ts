import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../common/entities/profile.entity';
import { Interest } from '../common/entities/interest.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from '../common/entities/user.entity';
import { UserRepository } from '../common/repository/user.repository';
import { ProfileRepository } from '../common/repository/profile.repository';
import { InterestRepository } from '../common/repository/interest.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Interest, User])],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    UserRepository,
    ProfileRepository,
    InterestRepository,
  ],
})
export class ProfileModule {}

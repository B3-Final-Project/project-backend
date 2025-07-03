import { Interest } from '../../common/entities/interest.entity';
import { InterestRepository } from '../../common/repository/interest.repository';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { ProfileService } from './services/profile.service';
import { Report } from '../../common/entities/report.entity';
import { ReportRepository } from '../../common/repository/report.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserRepository } from '../../common/repository/user.repository';
import { GeolocateService } from '../geolocate/geolocate.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Interest, User, Report])],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    UserRepository,
    ProfileRepository,
    InterestRepository,
    ReportRepository,
    GeolocateService,
  ],
})
export class ProfileModule {}

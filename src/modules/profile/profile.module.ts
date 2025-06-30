import { Interest } from '../../common/entities/interest.entity';
import { InterestRepository } from '../../common/repository/interest.repository';
import { Module } from '@nestjs/common';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { ProfileService } from './services/profile.service';
import { Report } from '../../common/entities/report.entity';
import { ReportRepository } from '../../common/repository/report.repository';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './services/s3.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserRepository } from '../../common/repository/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Profile, Interest, User, Report])],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    UserRepository,
    ProfileRepository,
    InterestRepository,
    ReportRepository,
    S3Service,
    {
      provide: S3Client,
      useFactory: () =>
        new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }),
    },
  ],
})
export class ProfileModule {}

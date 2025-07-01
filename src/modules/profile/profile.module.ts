import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../common/entities/profile.entity';
import { Interest } from '../../common/entities/interest.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './services/profile.service';
import { User } from '../../common/entities/user.entity';
import { UserRepository } from '../../common/repository/user.repository';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { InterestRepository } from '../../common/repository/interest.repository';
import { MulterModule } from '@nestjs/platform-express';
import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';
import { S3Service } from './services/s3.service';
import { GeolocateService } from '../geolocate/geolocate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, Interest, User]),
    MulterModule.registerAsync({
      useFactory: () => ({
        storage: multerS3({
          s3: new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          }),
          bucket: process.env.S3_BUCKET_NAME!,
          acl: 'public-read',
          key: (req, file, cb) => {
            // Create user-specific folders and unique filenames
            // @ts-expect-error wrong request type
            const userId = req.user?.userId || 'anonymous';
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${timestamp}-${randomString}.${fileExtension}`;

            // Organize by user folders: users/{userId}/images/{fileName}
            const key = `users/${userId}/${fileName}`;
            cb(null, key);
          },
          metadata: (req, file, cb) => {
            // Add metadata for better file management
            cb(null, {
              // @ts-expect-error wrong request type
              userId: req.user?.userId || 'anonymous',
              uploadedAt: new Date().toISOString(),
              originalName: file.originalname,
            });
          },
        }),
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB
          files: 1,
        },
        fileFilter: (req, file, cb) => {
          // Only allow image files
          const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
          if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
          }
        },
      }),
    }),
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    UserRepository,
    ProfileRepository,
    InterestRepository,
    S3Service,
    GeolocateService,
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

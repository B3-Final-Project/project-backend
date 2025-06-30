import { Module } from '@nestjs/common';
import { ProfileRepository } from '../../common/repository/profile.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { UserRepository } from '../../common/repository/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Profile } from '../../common/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile])],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, ProfileRepository],
  exports: [UsersService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { Report } from '../../common/entities/report.entity';
import { ReportRepository } from '../../common/repository/report.repository';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../../common/entities/profile.entity';
import { ProfileRepository } from '../../common/repository/profile.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Profile])],
  controllers: [ReportsController],
  providers: [ReportsService, ReportRepository, ProfileRepository],
  exports: [ReportsService],
})
export class ReportsModule {}

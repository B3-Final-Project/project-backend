import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import { ReportDto } from '../../modules/profile/dto/report.dto';

@Injectable()
export class ReportRepository {
  public constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  public async create(
    reportedProfileId: number,
    reporterUserId: string,
    reportDto: ReportDto,
  ): Promise<Report> {
    const report = this.reportRepository.create({
      reported_profile_id: reportedProfileId,
      reporterUserId,
      reason: reportDto.reason,
      message: reportDto.message,
    });

    return this.reportRepository.save(report);
  }

  public async findByProfileId(profileId: number): Promise<Report[]> {
    return this.reportRepository.find({
      where: { reported_profile_id: profileId },
      order: { created_at: 'DESC' },
    });
  }

  public async countByProfileId(profileId: number): Promise<number> {
    return this.reportRepository.count({
      where: { reported_profile_id: profileId },
    });
  }

  public async findAll(
    offset = 0,
    limit = 10,
  ): Promise<{ reports: Report[]; total: number }> {
    const [reports, total] = await this.reportRepository.findAndCount({
      relations: ['reportedProfile', 'reportedProfile.userProfile'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { reports, total };
  }

  public async deleteById(id: number): Promise<void> {
    await this.reportRepository.delete(id);
  }

  public async findById(id: number): Promise<Report | null> {
    return this.reportRepository.findOne({
      where: { id },
      relations: ['reportedProfile', 'reportedProfile.userProfile'],
    });
  }
}

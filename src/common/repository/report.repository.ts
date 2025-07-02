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

  public async findAllWithFilters(filters: {
    offset: number;
    limit: number;
    profileId?: number;
    reporterId?: string;
    status?: string;
  }): Promise<{ reports: Report[]; total: number }> {
    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reportedProfile', 'profile')
      .leftJoinAndSelect('profile.userProfile', 'user')
      .orderBy('report.created_at', 'DESC')
      .skip(filters.offset)
      .take(filters.limit);

    if (filters.profileId) {
      queryBuilder.andWhere('report.reported_profile_id = :profileId', {
        profileId: filters.profileId,
      });
    }

    if (filters.reporterId) {
      queryBuilder.andWhere('report.reporterUserId = :reporterId', {
        reporterId: filters.reporterId,
      });
    }

    // Note: Add status filter when status column exists in the entity
    // if (filters.status) {
    //   queryBuilder.andWhere('report.status = :status', {
    //     status: filters.status,
    //   });
    // }

    const [reports, total] = await queryBuilder.getManyAndCount();
    return { reports, total };
  }

  /**
   * Delete all reports for a given profileId
   */
  public async deleteByProfileId(profileId: number): Promise<void> {
    await this.reportRepository.delete({ reported_profile_id: profileId });
  }
}

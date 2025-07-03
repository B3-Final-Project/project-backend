import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { HttpRequestDto } from '../../common/dto/http-request.dto';
import { IsAdmin } from '../../auth/admin.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsListResponseDto } from './dto/report-response.dto';
import { HateoasInterceptor } from '../../common/interceptors/hateoas.interceptor';
import { HateoasLinks } from '../../common/decorators/hateoas.decorator';
import { AppLinkBuilders } from '../../common/utils/hateoas-links.util';
import { Report } from '../../common/entities/report.entity';

@ApiTags('reports')
@ApiBearerAuth('jwt-auth')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(HateoasInterceptor)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Create a new report' })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: Report,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid report data',
  })
  @HateoasLinks('report', AppLinkBuilders.reportLinks())
  @Post()
  public async createReport(
    @Req() req: HttpRequestDto,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.reportUser(req.user.userId, createReportDto);
  }

  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'profileId',
    required: false,
    type: Number,
    description: 'Filter by reported profile ID',
  })
  @ApiQuery({
    name: 'reporterId',
    required: false,
    type: String,
    description: 'Filter by reporter user ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by report status',
  })
  @ApiResponse({
    status: 200,
    description: 'Reports retrieved successfully',
    type: ReportsListResponseDto,
  })
  @HateoasLinks('reports', AppLinkBuilders.reportLinks())
  @UseGuards(IsAdmin)
  @Get()
  public async getAllReports(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('profileId') profileId?: number,
    @Query('reporterId') reporterId?: string,
    @Query('status') status?: string,
  ): Promise<ReportsListResponseDto> {
    const offset = (page - 1) * limit;
    return this.reportsService.getAllReports({
      offset,
      limit,
      profileId,
      reporterId,
      status,
    });
  }

  @ApiOperation({ summary: 'Get a specific report by ID (Admin only)' })
  @ApiParam({
    name: 'reportId',
    type: Number,
    description: 'ID of the report to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
    type: Report,
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  @HateoasLinks('report', AppLinkBuilders.reportLinks())
  @UseGuards(IsAdmin)
  @Get(':reportId')
  public async getReportById(
    @Param('reportId', ParseIntPipe) reportId: number,
  ): Promise<Report> {
    return this.reportsService.getReportById(reportId);
  }

  @ApiOperation({ summary: 'Delete a report (Admin only)' })
  @ApiParam({
    name: 'reportId',
    type: Number,
    description: 'ID of the report to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Report deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  @HateoasLinks('report', AppLinkBuilders.reportLinks())
  @UseGuards(IsAdmin)
  @Delete(':reportId')
  public async deleteReport(
    @Param('reportId', ParseIntPipe) reportId: number,
  ): Promise<{ message: string }> {
    return this.reportsService.deleteReport(reportId);
  }
}

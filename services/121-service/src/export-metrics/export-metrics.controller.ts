import {
  ApiBearerAuth,
  ApiUseTags,
  ApiOperation,
  ApiResponse,
  ApiImplicitParam,
  ApiImplicitQuery,
} from '@nestjs/swagger';
import {
  UseGuards,
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { RolesGuard } from '../roles.guard';
import { ExportMetricsService } from './export-metrics.service';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';
import { ExportDetails } from '../programs/program/dto/export-details';
import { User } from '../user/user.decorator';
import { ProgramMetrics } from '../programs/program/dto/program-metrics.dto';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('export-metrics')
@Controller('export-metrics')
export class ExportMetricsController {
  private readonly exportMetricsService: ExportMetricsService;
  public constructor(exportMetricsService: ExportMetricsService) {
    this.exportMetricsService = exportMetricsService;
  }

  @Roles(UserRole.PersonalData)
  @ApiOperation({
    title: 'Get an exported list of people',
  })
  @ApiResponse({
    status: 200,
    description: 'List of people exported',
  })
  @Post('export-list')
  public async getExportList(
    @Body() data: ExportDetails,
    @User('id') userId: number,
  ): Promise<any> {
    return await this.exportMetricsService.getExportList(
      data.programId,
      data.type,
      data.installment,
      userId,
    );
  }

  @Roles(UserRole.View, UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Get metrics by program-id' })
  @ApiImplicitParam({
    name: 'programId',
    required: true,
    type: 'integer',
  })
  @ApiImplicitQuery({
    name: 'installment',
    required: false,
    type: 'integer',
  })
  @ApiImplicitQuery({
    name: 'month',
    required: false,
    type: 'integer',
  })
  @ApiImplicitQuery({
    name: 'year',
    required: false,
    type: 'integer',
  })
  @ApiImplicitQuery({
    name: 'fromStart',
    required: false,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics of a program to gain an overview of the program ',
  })
  @Get('person-affected/:programId')
  public async getPAMetrics(
    @Param() params,
    @Query() query,
  ): Promise<ProgramMetrics> {
    return {
      pa: await this.exportMetricsService.getPaMetrics(
        Number(params.programId),
        query.installment ? Number(query.installment) : undefined,
        query.month ? Number(query.month) : undefined,
        query.year ? Number(query.year) : undefined,
        query.fromStart ? Number(query.fromStart) : undefined,
      ),
      updated: new Date(),
    };
  }

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Get monitoring data' })
  @ApiResponse({ status: 200, description: 'All monitoring data of a program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Get('/monitoring/:programId')
  public async getMonitoringData(@Param() params): Promise<any[]> {
    return await this.exportMetricsService.getMonitoringData(
      Number(params.programId),
    );
  }
}

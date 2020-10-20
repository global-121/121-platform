import { ProgramMetrics } from './dto/program-metrics.dto';
import { FinancialServiceProviderEntity } from './../fsp/financial-service-provider.entity';
import { FundingOverview } from './../../funding/dto/funding-overview.dto';
import { DidDto, DidsDto } from './dto/did.dto';
import {
  Get,
  Post,
  Body,
  Put,
  Delete,
  Query,
  Param,
  Controller,
  UseGuards,
} from '@nestjs/common';
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto';
import { ProgramsRO, ProgramRO, SimpleProgramRO } from './program.interface';
import { User } from '../../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
  ApiImplicitQuery,
} from '@nestjs/swagger';
import { ProgramEntity } from './program.entity';
import { DeleteResult } from 'typeorm';
import { IncludeMeDto } from './dto/include-me.dto';
import { InclusionStatus } from './dto/inclusion-status.dto';
import { InclusionRequestStatus } from './dto/inclusion-request-status.dto';
import { PayoutDto } from './dto/payout.dto';
import { RolesGuard } from '../../roles.guard';
import { Roles } from '../../roles.decorator';
import { UserRole } from '../../user-role.enum';
import { ChangeStateDto } from './dto/change-state.dto';
import { ExportDetails } from './dto/export-details';
import { NotificationDto } from './dto/notification';

@ApiBearerAuth()
@UseGuards(RolesGuard)
@ApiUseTags('programs')
@Controller('programs')
export class ProgramController {
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  @ApiOperation({ title: 'Get program by id' })
  @ApiImplicitParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':id')
  public async findOne(@Param() params): Promise<ProgramEntity> {
    return await this.programService.findOne(params.id);
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager)
  @ApiOperation({ title: 'Get funds by programId' })
  @ApiImplicitParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Return funds by program id.' })
  @Get('funds/:id')
  public async getFunds(@Param() params): Promise<FundingOverview> {
    return await this.programService.getFunds(params.id);
  }

  @ApiOperation({ title: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'Return all programs.' })
  @Get()
  public async findAll(): Promise<ProgramsRO> {
    return await this.programService.findAll();
  }

  @ApiOperation({ title: 'Get published programs' })
  @ApiResponse({ status: 200, description: 'Return all published programs.' })
  @Get('published/all')
  public async getPublishedPrograms(): Promise<ProgramsRO> {
    return await this.programService.getPublishedPrograms();
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Create program' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  public async create(
    @User('id') userId: number,
    @Body() programData: CreateProgramDto,
  ): Promise<ProgramEntity> {
    return this.programService.create(userId, programData);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Change program' })
  @ApiImplicitParam({ name: 'id', required: true, type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully changed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Put(':id')
  public async update(
    @Param() params,
    @User('id') userId: number,
    @Body() programData: CreateProgramDto,
  ): Promise<ProgramRO> {
    return this.programService.update(params.id, programData);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Delete program' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'id', required: true, type: 'string' })
  @Delete(':id')
  public async delete(@Param() params): Promise<DeleteResult> {
    return this.programService.delete(params.id);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'id', required: true, type: 'number' })
  @Post('changeState/:id')
  public async changeState(
    @Param() params,
    @Body() changeStateData: ChangeStateDto,
  ): Promise<SimpleProgramRO> {
    return this.programService.changeState(params.id, changeStateData.newState);
  }

  @ApiOperation({ title: 'Post proof (Used by PA)' })
  @Post('includeMe')
  public async includeMe(
    @Body() inclusionData: IncludeMeDto,
  ): Promise<InclusionRequestStatus> {
    return await this.programService.includeMe(
      inclusionData.programId,
      inclusionData.did,
      inclusionData.encryptedProof,
    );
  }

  @ApiOperation({ title: 'Get inclusion status (Used by PA)' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Post('inclusionStatus/:programId')
  public async inclusionStatus(
    @Param() params,
    @Body() data: DidDto,
  ): Promise<InclusionStatus> {
    return await this.programService.getInclusionStatus(
      params.programId,
      data.did,
    );
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Get all enrolled PAs in HO-portal' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Total number of included per program',
  })
  @Get('enrolled/:programId')
  public async getEnrolled(@Param() param): Promise<any[]> {
    return await this.programService.getConnections(param.programId, false);
  }

  @Roles(UserRole.ProgramManager)
  @ApiOperation({
    title: 'Get all enrolled PAs INCLUDING name/dob in HO-portal',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Total number of included per program',
  })
  @Get('enrolledPrivacy/:programId')
  public async getEnrolledWithNames(@Param() param): Promise<any[]> {
    return await this.programService.getConnections(param.programId, true);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Select set of PAs for validation' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Post('select-validation/:programId')
  public async selectForValidation(
    @Param() params,
    @Body() data: DidsDto,
  ): Promise<void> {
    await this.programService.selectForValidation(params.programId, data);
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager)
  @ApiOperation({ title: 'Include set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Post('include/:programId')
  public async include(@Param() params, @Body() data: DidsDto): Promise<void> {
    await this.programService.include(params.programId, data);
  }

  @Roles(UserRole.ProgramManager)
  @ApiOperation({ title: 'Reject set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Post('reject/:programId')
  public async reject(@Param() params, @Body() data: DidsDto): Promise<void> {
    await this.programService.reject(params.programId, data);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({ title: 'Send notification to set of PAs' })
  @Post('notify')
  public async notify(@Body() data: NotificationDto): Promise<void> {
    await this.programService.notify(data.programId, data.notificationType);
  }

  @Roles(UserRole.ProjectOfficer)
  @ApiOperation({
    title: 'Send payout instruction to financial service provider',
  })
  @Post('payout')
  public async payout(@Body() data: PayoutDto): Promise<any> {
    return await this.programService.payout(
      data.programId,
      data.installment,
      data.amount,
    );
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager)
  @ApiOperation({ title: 'Get status of payout-installments' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Get past payout-installments for program',
  })
  @Get('installments/:programId')
  public async getInstallments(@Param() param): Promise<any> {
    return await this.programService.getInstallments(param.programId);
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager)
  @ApiOperation({ title: 'Get transactions' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Get Get transactions',
  })
  @Get('transactions/:programId')
  public async getTransactions(@Param() param): Promise<any> {
    return await this.programService.getTransactions(param.programId);
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager)
  @ApiOperation({ title: 'Get total number of included per program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Total number of included per program',
  })
  @Get('total-included/:programId')
  public async getTotalIncluded(@Param() param): Promise<number> {
    return await this.programService.getTotalIncluded(param.programId);
  }

  @Roles(UserRole.ProgramManager)
  @ApiOperation({
    title: 'Get an exported list of people',
  })
  @ApiResponse({
    status: 200,
    description: 'List of people exported',
  })
  @Post('export-list')
  public async getExportList(@Body() data: ExportDetails): Promise<any> {
    return await this.programService.getExportList(
      data.programId,
      data.type,
      data.installment,
    );
  }

  @Roles(UserRole.ProjectOfficer, UserRole.ProgramManager)
  @ApiOperation({ title: 'Get metrics by program-id' })
  @ApiImplicitParam({ name: 'id', required: true })
  @ApiResponse({
    status: 200,
    description:
      'Get metrics of a program used by the project-officer to gain an overview of the program ',
  })
  @Get('metrics/:id')
  public async getMetrics(@Param() params): Promise<ProgramMetrics> {
    return await this.programService.getMetrics(params.id);
  }
}

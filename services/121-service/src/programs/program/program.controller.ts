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
import { PaymentDetailsRequest } from './dto/payment-details-request.dto';

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

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer)
  @ApiOperation({ title: 'Get funds by programId' })
  @ApiImplicitParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Return funds by program id.' })
  @Get('funds/:id')
  public async getFunds(@Param() params): Promise<FundingOverview> {
    return await this.programService.getFunds(params.id);
  }

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer, UserRole.Aidworker)
  @ApiOperation({ title: 'Get all programs' })
  @ApiImplicitQuery({ name: 'location', required: false })
  @ApiImplicitQuery({ name: 'countryId', required: false })
  @ApiResponse({ status: 200, description: 'Return all programs.' })
  @Get()
  public async findAll(@Query() query): Promise<ProgramsRO> {
    return await this.programService.findAll(query);
  }

  @ApiImplicitParam({ name: 'countryId', required: true, type: 'integer' })
  @ApiOperation({ title: 'Get published programs by country id' })
  @ApiResponse({
    status: 200,
    description: 'Return all published programs by country',
  })
  @Get('country/:countryId')
  public async findByCountry(@Param() param): Promise<ProgramsRO> {
    return await this.programService.findByCountry(param.countryId);
  }

  @Roles(UserRole.ProgramManager)
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

  @Roles(UserRole.ProgramManager)
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

  @Roles(UserRole.ProgramManager)
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

  @Roles(UserRole.ProgramManager)
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

  @Roles(UserRole.ProgramManager)
  @ApiOperation({ title: 'Get all enrolled PAs in HO-portal' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Total number of included per program',
  })
  @Get('enrolled/:programId')
  public async getEnrolled(@Param() param): Promise<any[]> {
    return await this.programService.getEnrolled(param.programId, false);
  }

  @Roles(UserRole.PrivacyOfficer)
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
    return await this.programService.getEnrolled(param.programId, true);
  }

  @Roles(UserRole.ProgramManager)
  @ApiOperation({ title: 'Select set of PAs for validation' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Post('select-validation/:programId')
  public async selectForValidation(
    @Param() params,
    @Body() data: DidsDto,
  ): Promise<void> {
    await this.programService.selectForValidation(params.programId, data);
  }

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer)
  @ApiOperation({ title: 'Include set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Post('include/:programId')
  public async include(@Param() params, @Body() data: DidsDto): Promise<void> {
    await this.programService.include(params.programId, data);
  }

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer)
  @ApiOperation({ title: 'Exclude set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @Post('exclude/:programId')
  public async exclude(@Param() params, @Body() data: DidsDto): Promise<void> {
    await this.programService.exclude(params.programId, data);
  }

  @Roles(UserRole.ProgramManager)
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

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer)
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

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer)
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

  @ApiOperation({ title: 'Get fsp' })
  @ApiImplicitParam({ name: 'fspId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Fsp with attributes',
  })
  @Get('fsp/:fspId')
  public async getFspById(
    @Param() param,
  ): Promise<FinancialServiceProviderEntity> {
    return await this.programService.getFspById(param.fspId);
  }

  @Roles(UserRole.PrivacyOfficer)
  @ApiOperation({
    title: 'Get a list payment details per person to share with officials',
  })
  @ApiResponse({
    status: 200,
    description: 'Total number of included per program',
  })
  @Post('payment-details')
  public async getPaymentDetails(
    @Body() data: PaymentDetailsRequest,
  ): Promise<any> {
    return await this.programService.getPaymentDetails(
      data.programId,
      data.installment,
    );
  }

  @Roles(UserRole.ProgramManager, UserRole.PrivacyOfficer)
  @ApiOperation({ title: 'Get metrics by program-id' })
  @ApiImplicitParam({ name: 'id', required: true })
  @ApiResponse({
    status: 200,
    description:
      'Get metrics of a program used by the program manager to gain an overview of the program ',
  })
  @Get('metrics/:id')
  public async getMetrics(@Param() params): Promise<ProgramMetrics> {
    return await this.programService.getMetrics(params.id);
  }
}

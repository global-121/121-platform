import { TransactionEntity } from './transactions.entity';
import { ProgramMetrics } from './dto/program-metrics.dto';
import { ReferenceIdDto, ReferenceIdsDto } from './dto/reference-id.dto';
import {
  Get,
  Post,
  Body,
  Delete,
  Param,
  Controller,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
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
import { InclusionStatus } from './dto/inclusion-status.dto';
import { PayoutDto, TotalIncluded } from './dto/payout.dto';
import { RolesGuard } from '../../roles.guard';
import { Roles } from '../../roles.decorator';
import { UserRole } from '../../user-role.enum';
import { ChangeStateDto } from './dto/change-state.dto';
import { ExportDetails } from './dto/export-details';
import { CustomCriterium } from './custom-criterium.entity';
import { UpdateCustomCriteriumDto } from './dto/update-custom-criterium.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { MessageDto } from './dto/message.dto';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
import { PaStatusTimestampField } from '../../models/pa-status.model';

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
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':programId')
  public async findOne(@Param() params): Promise<ProgramEntity> {
    return await this.programService.findOne(Number(params.programId));
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

  @Roles(UserRole.RunProgram)
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

  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'Delete program' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Delete(':programId')
  public async delete(@Param() params): Promise<DeleteResult> {
    return this.programService.delete(Number(params.programId));
  }

  @Roles(UserRole.RunProgram)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('changeState/:programId')
  public async changeState(
    @Param() params,
    @Body() changeStateData: ChangeStateDto,
  ): Promise<SimpleProgramRO> {
    return this.programService.changeState(
      Number(params.programId),
      changeStateData.newState,
    );
  }

  @ApiOperation({ title: 'Get inclusion status (Used by PA)' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('inclusionStatus/:programId')
  public async inclusionStatus(
    @Param() params,
    @Body() data: ReferenceIdDto,
  ): Promise<InclusionStatus> {
    return await this.programService.getInclusionStatus(
      Number(params.programId),
      data.referenceId,
    );
  }

  @Roles(UserRole.View, UserRole.RunProgram)
  @ApiOperation({ title: 'Get all enrolled PA' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'All included PA per program',
  })
  @Get('enrolled/:programId')
  public async getEnrolled(@Param() params): Promise<any[]> {
    return await this.programService.getConnections(
      Number(params.programId),
      false,
    );
  }

  @Roles(UserRole.View, UserRole.PersonalData)
  @ApiOperation({
    title: 'Get all enrolled PA INCLUDING personal details',
  })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'All included PA per program (including personal details)',
  })
  @Get('enrolledPrivacy/:programId')
  public async getEnrolledWithNames(@Param() params): Promise<any[]> {
    return await this.programService.getConnections(
      Number(params.programId),
      true,
    );
  }

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Get monitoring data' })
  @ApiResponse({ status: 200, description: 'All monitoring data of a program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Get('/monitoring/:programId')
  public async getMonitoringData(@Param() params): Promise<any[]> {
    return await this.programService.getMonitoringData(
      Number(params.programId),
    );
  }

  @Roles(UserRole.RunProgram)
  @ApiOperation({ title: 'Select set of PAs for validation' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('select-validation/:programId')
  public async selectForValidation(
    @Param() params,
    @Body() data: ReferenceIdsDto,
  ): Promise<void> {
    await this.programService.setPaStatusTimestampField(
      params.programId,
      data,
      PaStatusTimestampField.selectedForValidationDate,
    );
  }

  @Roles(UserRole.PersonalData)
  @ApiOperation({ title: 'Mark set of PAs as no longer eligible' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('no-longer-eligible/:programId')
  public async markNoLongerEligible(
    @Param() params,
    @Body() data: ReferenceIdsDto,
  ): Promise<void> {
    await this.programService.setPaStatusTimestampField(
      Number(params.programId),
      data,
      PaStatusTimestampField.noLongerEligibleDate,
    );
  }

  @Roles(UserRole.PersonalData)
  @ApiOperation({ title: 'Invite set of PAs for registration' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('invite/:programId')
  public async invite(
    @Param() params,
    @Body() phoneNumbers: string,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.programService.invite(
      Number(params.programId),
      phoneNumbers,
      messageData.message,
    );
  }

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Include set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('include/:programId')
  public async include(
    @Param() params,
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.programService.include(
      Number(params.programId),
      referenceIdsData,
      messageData.message,
    );
  }

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'End inclusion of set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('end/:programId')
  public async end(
    @Param() params,
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.programService.end(
      Number(params.programId),
      referenceIdsData,
      messageData.message,
    );
  }

  @Roles(UserRole.PersonalData)
  @ApiOperation({ title: 'Reject set of PAs' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('reject/:programId')
  public async reject(
    @Param() params,
    @Body() referenceIdsData: ReferenceIdsDto,
    @Body() messageData: MessageDto,
  ): Promise<void> {
    await this.programService.reject(
      Number(params.programId),
      referenceIdsData,
      messageData.message,
    );
  }

  @Roles(UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({
    title: 'Send payout instruction to financial service provider',
  })
  @Post('payout')
  public async payout(
    @Body() data: PayoutDto,
    @User('id') userId: number,
  ): Promise<number> {
    return await this.programService.payout(
      userId,
      data.programId,
      data.installment,
      data.amount,
      data.referenceId,
    );
  }

  @Roles(UserRole.View, UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Get past installments for program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Get past installments for program',
  })
  @Get('installments/:programId')
  public async getInstallments(@Param() params): Promise<any> {
    return await this.programService.getInstallments(Number(params.programId));
  }

  @Roles(UserRole.View, UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Get transactions' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiImplicitQuery({
    name: 'minInstallment',
    required: false,
    type: 'integer',
  })
  @ApiResponse({
    status: 200,
    description: 'Get all transactions',
  })
  @Get('transactions/:programId')
  public async getTransactions(
    @Param('programId') programId: number,
    @Query('minInstallment') minInstallment: number,
  ): Promise<any> {
    return await this.programService.getTransactions(
      Number(programId),
      minInstallment,
    );
  }

  @Roles(UserRole.View, UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Get a single transaction' })
  @ApiResponse({
    status: 200,
    description: 'Get a single transaction',
  })
  @Post('get-transaction')
  public async getTransaction(
    @Body() data: GetTransactionDto,
  ): Promise<GetTransactionOutputDto> {
    return await this.programService.getTransaction(data);
  }

  @Roles(UserRole.View, UserRole.RunProgram, UserRole.PersonalData)
  @ApiOperation({ title: 'Get total number of included per program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Total number of included per program',
  })
  @Get('total-included/:programId')
  public async getTotalIncluded(@Param() params): Promise<TotalIncluded> {
    return await this.programService.getTotalIncluded(Number(params.programId));
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
    return await this.programService.getExportList(
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
  @Get('metrics/:programId')
  public async getMetrics(
    @Param() params,
    @Query() query,
  ): Promise<ProgramMetrics> {
    return {
      pa: await this.programService.getPaMetrics(
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
  @ApiOperation({ title: 'Update program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('update/program/:programId')
  public async updateProgram(
    @Param() params,
    @Body() updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramEntity> {
    return await this.programService.updateProgram(
      Number(params.programId),
      updateProgramDto,
    );
  }

  @Roles(UserRole.Admin)
  @ApiOperation({ title: 'Update custom criterium' })
  @Post('update/custom-criterium')
  public async updateCustomCriterium(
    @Body() updateCustomCriteriumDto: UpdateCustomCriteriumDto,
  ): Promise<CustomCriterium> {
    return await this.programService.updateCustomCriterium(
      updateCustomCriteriumDto,
    );
  }
}

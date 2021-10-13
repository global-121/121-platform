import { ProgramQuestionEntity } from './program-question.entity';
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
import { ProgramService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramsRO, SimpleProgramRO } from './program.interface';
import { User } from '../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
  ApiImplicitQuery,
} from '@nestjs/swagger';
import { ProgramEntity } from './program.entity';
import { PayoutDto } from './dto/payout.dto';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UserRole } from '../user-role.enum';
import { UpdateProgramQuestionDto } from './dto/update-program-question.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import {
  GetTransactionDto,
  GetTransactionOutputDto,
} from './dto/get-transaction.dto';
import { ChangePhaseDto } from './dto/change-phase.dto';

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
    @Body() programData: CreateProgramDto,
  ): Promise<ProgramEntity> {
    return this.programService.create(programData);
  }

  @Roles(UserRole.RunProgram)
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('change-phase/:programId')
  public async changePhase(
    @Param() params,
    @Body() changePhaseData: ChangePhaseDto,
  ): Promise<SimpleProgramRO> {
    return this.programService.changePhase(
      Number(params.programId),
      changePhaseData.newPhase,
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
      false,
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

  @Roles(UserRole.Admin, UserRole.RunProgram)
  @ApiOperation({ title: 'Update program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'integer' })
  @Post('update/:programId')
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
  @ApiOperation({ title: 'Update program questions' })
  @Post('update/program-question')
  public async updateProgramQuestion(
    @Body() updateProgramQuestionDto: UpdateProgramQuestionDto,
  ): Promise<ProgramQuestionEntity> {
    return await this.programService.updateProgramQuestion(
      updateProgramQuestionDto,
    );
  }
}

import { FundingOverview } from './../../funding/dto/funding-overview.dto';
import { DidDto } from './dto/did.dto';
import {
  Get,
  Post,
  Body,
  Put,
  Delete,
  Query,
  Param,
  Controller,
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

@ApiUseTags('programs')
@Controller('programs')
export class ProgramController {
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get program by id' })
  @ApiImplicitParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':id')
  public async findOne(@Param() params): Promise<ProgramEntity> {
    return await this.programService.findOne(params.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get funds by programId' })
  @ApiImplicitParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Return funds by program id.' })
  @Get('funds/:id')
  public async getFunds(@Param() params): Promise<FundingOverview> {
    return await this.programService.getFunds(params.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get all programs' })
  @ApiImplicitQuery({ name: 'location', required: false })
  @ApiImplicitQuery({ name: 'countryId', required: false })
  @ApiResponse({ status: 200, description: 'Return all programs.' })
  @Get()
  public async findAll(@Query() query): Promise<ProgramsRO> {
    return await this.programService.findAll(query);
  }

  @ApiOperation({ title: 'Get published programs by country id' })
  @ApiImplicitParam({ name: 'countryId', required: true, type: 'integer' })
  @ApiResponse({
    status: 200,
    description: 'Return all published programs by country',
  })
  @Get('country/:countryId')
  public async findByCountry(@Param() param): Promise<ProgramsRO> {
    return await this.programService.findByCountry(param.countryId);
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'id', required: true, type: 'number' })
  @Post('publish/:id')
  public async publish(@Param() params): Promise<SimpleProgramRO> {
    return this.programService.publish(params.id);
  }

  @ApiBearerAuth()
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'id', required: true, type: 'number' })
  @Post('unpublish/:id')
  public async unpublish(@Param() params): Promise<SimpleProgramRO> {
    return this.programService.unpublish(params.id);
  }

  @ApiOperation({ title: 'Post proof' })
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

  @ApiOperation({ title: 'Get inclusion status' })
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

  @ApiOperation({ title: 'Sent payout instruction to financial service provider' })
  @Post('payout')
  public async payout(
    @Body() data: PayoutDto,
  ): Promise<void> {
    return await this.programService.payout(
      data.programId,
      data.amount,
    );
  }

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

}

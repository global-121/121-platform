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
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { InculdeMeDto } from './dto/include-me.dto';

@ApiUseTags('programs')
@Controller('programs')
export class ProgramController {
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  @ApiBearerAuth()
  @ApiOperation({ title: 'Get program by id' })
  @ApiImplicitQuery({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':id')
  public async findOne(@Query() query): Promise<ProgramEntity> {
    return await this.programService.findOne(query);
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

  @ApiOperation({ title: 'Get inclusion status' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @ApiImplicitParam({ name: 'did', required: true, type: 'string' })
  @Get('inclusionStatus/:programId/:did')
  public async inclusionStatus(@Param() params): Promise<any> {
    return await this.programService.getInclusionStatus(
      params.programId,
      params.did,
    );
  }

  @ApiOperation({ title: 'Post proof' })
  @Post('includeMe')
  public async includeMe(
    @Body() inclusionData: InculdeMeDto,
  ): Promise<ConnectionEntity> {
    return await this.programService.includeMe(
      inclusionData.programId,
      inclusionData.did,
      inclusionData.encryptedProof,
    );
  }
}

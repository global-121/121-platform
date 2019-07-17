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
import { ProgramsRO, ProgramRO } from './program.interface';
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

@ApiBearerAuth()
@ApiUseTags('programs')
@Controller('programs')
export class ProgramController {
  private readonly programService: ProgramService;
  public constructor(programService: ProgramService) {
    this.programService = programService;
  }

  @ApiOperation({ title: 'Get program by id' })
  @ApiImplicitQuery({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Return program by id.' })
  @Get(':id')
  public async findOne(@Query() query): Promise<ProgramEntity> {
    return await this.programService.findOne(query);
  }

  @ApiOperation({ title: 'Get all programs' })
  @ApiImplicitQuery({ name: 'location', required: false })
  @ApiImplicitQuery({ name: 'countryId', required: false })
  @ApiResponse({ status: 200, description: 'Return all programs.' })
  @Get()
  public async findAll(@Query() query): Promise<ProgramsRO> {
    return await this.programService.findAll(query);
  }

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

  @ApiOperation({ title: 'Change program' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'number' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully changed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Put(':programId')
  public async update(
    @Param() params,
    @User('id') userId: number,
    @Body() programData: CreateProgramDto,
  ): Promise<ProgramRO> {
    return this.programService.update(params.programId, programData);
  }

  @ApiOperation({ title: 'Delete program' })
  @ApiResponse({
    status: 201,
    description: 'The program has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({ name: 'programId', required: true, type: 'string' })
  @Delete(':programId')
  public async delete(@Param() params): Promise<DeleteResult> {
    return this.programService.delete(params.programId);
  }
}

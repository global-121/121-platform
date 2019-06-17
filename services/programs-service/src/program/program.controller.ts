import {Get, Post, Body, Put, Delete, Query, Param, Controller} from '@nestjs/common';
import { Request } from 'express';
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto';
import { ProgramsRO, ProgramRO } from './program.interface';
import { User } from '../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('programs')
@Controller('programs')
export class ProgramController {

  constructor(private readonly programService: ProgramService) {}

  @ApiOperation({ title: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'Return all programs.'})
  @Get()
  async findAll(@Query() query): Promise<ProgramsRO> {
    return await this.programService.findAll(query);
  }

  @ApiOperation({ title: 'Create program' })
  @ApiResponse({ status: 201, description: 'The program has been successfully created.'})
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  // @ApiImplicitBody({ name: 'CreateProgramDto', description: '', type: CreateProgramDto })
  @Post()
  async create(@User('id') userId: number, @Body() programData: CreateProgramDto) {
    return this.programService.create(userId, programData);
  }

  @ApiOperation({ title: 'Change program' })
  @ApiImplicitParam({name: 'programId', required: true, type: 'number'})
  @ApiResponse({ status: 201, description: 'The program has been successfully changed.'})
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Put(':programId')
  async update(@Param() params, @User('id') userId: number,  @Body() programData: CreateProgramDto) {
    return this.programService.update(params.programId, programData);
  }

  @ApiOperation({ title: 'Delete program' })
  @ApiResponse({ status: 201, description: 'The program has been successfully deleted.'})
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({name: 'programId', required: true, type: 'string'})
  @Delete(':programId')
  async delete(@Param() params) {
    return this.programService.delete(params.programId);
  }
}

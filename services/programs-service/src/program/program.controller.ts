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
  ApiImplicitBody,
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

  // @Get(':slug')
  // @ApiImplicitParam({name: 'email', required: true, type: 'string'})
  // async findOne(@Param('slug') slug): Promise<ProgramRO> {
  //   return await this.programService.findOne({slug});
  // }

  @ApiOperation({ title: 'Create program' })
  @ApiResponse({ status: 201, description: 'The program has been successfully created.'})
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  // @ApiImplicitBody({ name: 'CreateProgramDto', description: '', type: CreateProgramDto })
  @Post()
  async create(@User('id') userId: number, @Body() programData: CreateProgramDto) {
    return this.programService.create(userId, programData);
  }

  // @ApiOperation({ title: 'Update program' })
  // @ApiResponse({ status: 201, description: 'The program has been successfully updated.'})
  // @ApiResponse({ status: 403, description: 'Forbidden.' })
  // @Put(':slug')
  // async update(@Param() params, @Body('program') programData: CreateProgramDto) {
  //   // Todo: update slug also when title gets changed
  //   return this.programService.update(params.slug, programData);
  // }

  @ApiOperation({ title: 'Delete program' })
  @ApiResponse({ status: 201, description: 'The program has been successfully deleted.'})
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiImplicitParam({name: 'slug', required: true, type: 'string'})
  @Delete(':slug')
  async delete(@Param() params) {
    return this.programService.delete(params.slug);
  }


}
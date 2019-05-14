import {Get, Post, Body, Controller } from '@nestjs/common';

import { OptionEntity } from './option.entity';
import { OptionService } from './option.service';
import { CreateOptionDto } from './dto';
//import { User } from '../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitBody,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('criterium-options')
@Controller('criterium-options')
export class OptionController {

  constructor(private readonly optionService: OptionService) {}

  // @Get()
  // async findAll(): Promise<OptionEntity[]> {
  //   return await this.optionService.findAll();
  // }

  // @ApiOperation({ title: 'Create option' })
  // @ApiResponse({ status: 201, description: 'The option has been successfully created.'})
  // @ApiResponse({ status: 403, description: 'Forbidden.' })
  // // @ApiImplicitBody({ name: 'CreateOptionDto', description: '', type: CreateOptionDto })
  // @Post()
  // async create(@Body() optionData: CreateOptionDto) {
  //   return this.optionService.create(optionData);
  // }

}

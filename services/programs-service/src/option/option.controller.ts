import { Get, Post, Body, Controller, Param } from '@nestjs/common';

import { OptionEntity } from './option.entity';
import { OptionService } from './option.service';
import { CreateOptionDto } from './dto';
//import { User } from '../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('criterium-options')
@Controller('criterium-options')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @ApiOperation({ title: 'Get all criterium-dropdown-options' })
  @Get()
  async findAll(): Promise<OptionEntity[]> {
    return await this.optionService.findAll();
  }

  @ApiOperation({ title: 'Create new option for dropdown-criterium' })
  @ApiImplicitParam({ name: 'criteriumId', required: true, type: 'number' })
  @Post(':criteriumId')
  async create(@Param() params, @Body() optionData: CreateOptionDto) {
    return this.optionService.create(params.criteriumId, optionData);
  }
}

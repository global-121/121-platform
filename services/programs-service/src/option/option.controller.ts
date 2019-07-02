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
  private readonly optionService: OptionService;
  public constructor(optionService: OptionService) {
    this.optionService = optionService;
  }

  @ApiOperation({ title: 'Get all criterium-dropdown-options' })
  @Get()
  public async findAll(): Promise<OptionEntity[]> {
    return await this.optionService.findAll();
  }

  @ApiOperation({ title: 'Create new option for dropdown-criterium' })
  @ApiImplicitParam({ name: 'criteriumId', required: true, type: 'number' })
  @Post(':criteriumId')
  public async create(
    @Param() params,
    @Body() optionData: CreateOptionDto,
  ): Promise<OptionEntity> {
    return this.optionService.create(params.criteriumId, optionData);
  }
}

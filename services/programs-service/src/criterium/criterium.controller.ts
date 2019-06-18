import { Get, Post, Body, Controller, Param } from '@nestjs/common';

import { CriteriumEntity } from './criterium.entity';
import { CriteriumService } from './criterium.service';
import { CreateCriteriumDto } from './dto';
import { User } from '../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('criteriums')
@Controller('criteriums')
export class CriteriumController {
  constructor(private readonly criteriumService: CriteriumService) {}

  @ApiOperation({ title: 'Get all criteria' })
  @Get()
  async findAll(): Promise<CriteriumEntity[]> {
    return await this.criteriumService.findAll();
  }

  @ApiOperation({ title: 'Get criteria by country' })
  @ApiImplicitParam({ name: 'countryId', required: true, type: 'number' })
  @Get(':countryId')
  async find(@Param() params): Promise<CriteriumEntity[]> {
    return await this.criteriumService.find(params.countryId);
  }

  @ApiOperation({ title: 'Create criterium' })
  @ApiResponse({
    status: 201,
    description: 'The criterium has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  async create(
    @User('id') userId: number,
    @Body() criteriumData: CreateCriteriumDto,
  ) {
    return this.criteriumService.create(userId, criteriumData);
  }
}

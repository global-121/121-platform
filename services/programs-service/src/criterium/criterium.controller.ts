import {Get, Post, Body, Controller } from '@nestjs/common';

import { CriteriumEntity } from './criterium.entity';
import { CriteriumService } from './criterium.service';
import { CreateCriteriumDto } from './dto';
import { User } from '../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitBody,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('criteriums')
@Controller('criteriums')
export class CriteriumController {

  constructor(private readonly criteriumService: CriteriumService) {}

  @Get()
  async findAll(): Promise<CriteriumEntity[]> {
    return await this.criteriumService.findAll();
  }

  @ApiOperation({ title: 'Create criterium' })
  @ApiResponse({ status: 201, description: 'The criterium has been successfully created.'})
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  // @ApiImplicitBody({ name: 'CreateCriteriumDto', description: '', type: CreateCriteriumDto })
  @Post()
  async create(@User('id') userId: number, @Body() criteriumData: CreateCriteriumDto) {
    return this.criteriumService.create(userId, criteriumData);
  }

}

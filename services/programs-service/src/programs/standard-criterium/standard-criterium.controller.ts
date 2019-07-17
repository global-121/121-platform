import { Get, Post, Body, Controller, Param } from '@nestjs/common';

import { StandardCriteriumEntity } from './standard-criterium.entity';
import { StandardCriteriumService } from './standard-criterium.service';
import { User } from '../../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { CreateStandardCriteriumDto } from './dto/create-standard-criterium.dto';

@ApiBearerAuth()
@ApiUseTags('standard-criteriums')
@Controller('standard-criteriums')
export class StandardCriteriumController {
  private readonly criteriumService: StandardCriteriumService;
  public constructor(criteriumService: StandardCriteriumService) {
    this.criteriumService = criteriumService;
  }

  @ApiOperation({ title: 'Get all criteria' })
  @Get()
  public async findAll(): Promise<StandardCriteriumEntity[]> {
    return await this.criteriumService.findAll();
  }

  @ApiOperation({ title: 'Get criteria by country' })
  @ApiImplicitParam({ name: 'countryId', required: true, type: 'number' })
  @Get(':countryId')
  public async find(@Param() params): Promise<StandardCriteriumEntity[]> {
    return await this.criteriumService.find(params.countryId);
  }

  @ApiOperation({ title: 'Create criterium' })
  @ApiResponse({
    status: 201,
    description: 'The criterium has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  public async create(
    @User('id') userId: number,
    @Body() criteriumData: CreateStandardCriteriumDto,
  ): Promise<StandardCriteriumEntity> {
    return this.criteriumService.create(userId, criteriumData);
  }
}

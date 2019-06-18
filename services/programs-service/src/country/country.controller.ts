import { Get, Post, Put, Body, Controller, Param } from '@nestjs/common';

import { CountryEntity } from './country.entity';
import { CountryService } from './country.service';
import { CreateCountryDto, BindCriteriumCountryDto } from './dto';
import { User } from '../user/user.decorator';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { URLSearchParams } from 'url';

@ApiBearerAuth()
@ApiUseTags('countrys')
@Controller('countrys')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @ApiOperation({ title: 'Get all criteria' })
  @Get()
  async findAll(): Promise<CountryEntity[]> {
    return await this.countryService.findAll();
  }

  @ApiOperation({ title: 'Create country' })
  @ApiResponse({
    status: 201,
    description: 'The country has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  async create(@Body() countryData: CreateCountryDto) {
    return this.countryService.create(countryData);
  }

  @ApiOperation({ title: 'Add criterium to country' })
  @Put(':countryId')
  async bindCriteriumCountry(
    @Body() countryCriteriumData: BindCriteriumCountryDto,
  ) {
    return this.countryService.bindCriteriumCountry(countryCriteriumData);
  }
}

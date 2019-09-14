import { Get, Post, Put, Body, Controller } from '@nestjs/common';

import { CountryEntity } from './country.entity';
import { CountryService } from './country.service';
import { CreateCountryDto, BindCriteriumCountryDto } from './dto';

import {
  ApiUseTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiUseTags('programs')
@Controller('programs/countries')
export class CountryController {
  private readonly countryService: CountryService;
  public constructor(countryService: CountryService) {
    this.countryService = countryService;
  }

  @ApiOperation({ title: 'Get all countries' })
  @ApiResponse({ status: 200, description: 'Got all countries' })
  @Get('/all')
  public async findAll(): Promise<CountryEntity[]> {
    return await this.countryService.findAll();
  }

  @ApiOperation({ title: 'Create country' })
  @ApiResponse({
    status: 201,
    description: 'The country has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  public async create(
    @Body() countryData: CreateCountryDto,
  ): Promise<CountryEntity> {
    return this.countryService.create(countryData);
  }

  @ApiOperation({ title: 'Add criterium to country' })
  @Put(':countryId')
  public async bindCriteriumCountry(
    @Body() countryCriteriumData: BindCriteriumCountryDto,
  ): Promise<CountryEntity> {
    return this.countryService.bindCriteriumCountry(countryCriteriumData);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountryEntity } from './country.entity';
import { UserEntity } from '../user/user.entity';
import { CreateCountryDto, BindCriteriumCountryDto } from './dto';

@Injectable()
export class CountryService {
  @InjectRepository(CountryEntity)
  private readonly countryRepository: Repository<CountryEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  public constructor() {}

  public async findAll(): Promise<CountryEntity[]> {
    return await this.countryRepository.find();
  }

  public async create(countryData: CreateCountryDto): Promise<CountryEntity> {
    let country = new CountryEntity();
    country.country = countryData.country;

    const newCountry = await this.countryRepository.save(country);

    return newCountry;
  }

  public async bindCriteriumCountry(
    countryCriteriumData: BindCriteriumCountryDto,
  ): Promise<CountryEntity> {
    const countryId = countryCriteriumData.countryId;
    const criteriumId = countryCriteriumData.criteriumId;
    let country = await this.countryRepository.findOne(countryId);

    if (Array.isArray(country.criteriumIds)) {
      country.criteriumIds.push(criteriumId);
    } else {
      country.criteriumIds = [criteriumId];
    }

    const updatedCountry = await this.countryRepository.save(country);

    return updatedCountry;
  }
}

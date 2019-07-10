import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StandardCriteriumEntity } from './standard-criterium.entity';
import { UserEntity } from '../user/user.entity';
import { CreateStandardCriteriumDto } from './dto';
import { CountryEntity } from '../country/country.entity';

@Injectable()
export class StandardCriteriumService {
  @InjectRepository(StandardCriteriumEntity)
  private readonly criteriumRepository: Repository<StandardCriteriumEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(CountryEntity)
  private readonly countryRepository: Repository<CountryEntity>;
  public constructor() {}

  public async findAll(): Promise<StandardCriteriumEntity[]> {
    return await this.criteriumRepository.find();
  }

  public async find(countryId: number): Promise<StandardCriteriumEntity[]> {
    const country = await this.countryRepository.findOne(countryId);
    return await this.criteriumRepository
      .createQueryBuilder('table')
      .where('table.id IN (:...criteriums)', {
        criteriums: country.criteriumIds,
      })
      .getMany();
  }

  public async create(
    userId: number,
    criteriumData: CreateStandardCriteriumDto,
  ): Promise<StandardCriteriumEntity> {
    let criterium = new StandardCriteriumEntity();
    criterium.criterium = criteriumData.criterium;
    criterium.answerType = criteriumData.answerType;
    criterium.criteriumType = criteriumData.criteriumType;
    criterium.options = criteriumData.options;
    criterium.question = criteriumData.question;

    // const author = await this.userRepository.findOne(userId);
    criterium.author = null;
    const newCriterium = await this.criteriumRepository.save(criterium);

    return newCriterium;
  }
}

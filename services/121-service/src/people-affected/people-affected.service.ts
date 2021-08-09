import { PersonAffectedAppDataEntity } from './person-affected-app-data.entity';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { StoreDataDto } from './dto/store-data.dto';

@Injectable()
export class PeopleAffectedService {
  @InjectRepository(PersonAffectedAppDataEntity)
  private readonly dataStorageRepository: Repository<
    PersonAffectedAppDataEntity
  >;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  public constructor() {}

  public async postData(
    userId: number,
    storeData: StoreDataDto,
  ): Promise<void> {
    let data = new PersonAffectedAppDataEntity();
    const user = await this.userRepository.findOne(userId);

    data.user = user;
    data.type = storeData.type;
    data.data = storeData.data;

    // We used to encrpyt the data in the PA accounts service, but we decided to remove this in the refactor
    // As this data is stored in different tables anyway

    await this.dataStorageRepository.save(data);
  }

  public async getData(userId: number, type: string): Promise<string> {
    const data = await this.dataStorageRepository.find({
      where: {
        user: { id: userId },
        type: type,
      },
      order: { created: 'DESC' },
    });
    if (!data || data.length === 0) {
      throw new HttpException('', HttpStatus.NOT_FOUND);
    }
    return JSON.stringify(data[0].data);
  }
}

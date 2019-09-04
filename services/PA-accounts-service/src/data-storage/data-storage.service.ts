import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataStorageEntity } from './data-storage.entity';
import { UserEntity } from '../user/user.entity';
import { StoreDataDto, GetDataDto } from './dto';

@Injectable()
export class DataStorageService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(DataStorageEntity)
  private readonly dataStorageRepository: Repository<DataStorageEntity>;

  public constructor() { }

  public async post(
    userId: number,
    storeData: StoreDataDto,
  ): Promise<DataStorageEntity> {
    let data = new DataStorageEntity();
    data.username = storeData.username;
    data.type = storeData.type;
    data.data = storeData.data;

    const newData = await this.dataStorageRepository.save(data);

    return newData;
  }

  public async get(
    userId: number,
    params,
  ): Promise<String> {
    const data = await this.dataStorageRepository.findOne({ where: { username: params.username, type: params.type } });
    if (!data) {
      const errors = { Data: ' not found' };
      throw new HttpException({ errors }, 401);
    }
    return data.data;
  }


}

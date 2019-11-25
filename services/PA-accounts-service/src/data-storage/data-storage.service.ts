import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataStorageEntity } from './data-storage.entity';
import { UserEntity } from '../user/user.entity';
import { StoreDataDto } from './dto';

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
    data.userId = userId;
    data.type = storeData.type;
    data.data = storeData.data;

    const newData = await this.dataStorageRepository.save(data);

    return newData;
  }

  public async get(
    userId: number,
    params,
  ): Promise<String> {
    console.log(userId)
    const data = await this.dataStorageRepository.find({
      where: {
        userId: userId,
        type: params.type
      },
      order: { created: "DESC" }
    });
    if (!data || data.length === 0 ) {
      const errors = { Data: ' not found' };
      throw new HttpException({ errors }, 404);
    }
    return JSON.stringify(data[0].data);
  }


}

import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataStorageEntity } from './data-storage.entity';
import { UserEntity } from '../user/user.entity';
import { StoreDataDto } from './dto';
import { walletPasswordEncryptionKey } from '../config';
const Cryptr = require('cryptr');

@Injectable()
export class DataStorageService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(DataStorageEntity)
  private readonly dataStorageRepository: Repository<DataStorageEntity>;

  public constructor() { }

  public cryptr = new Cryptr(walletPasswordEncryptionKey);

  public async post(
    userId: number,
    storeData: StoreDataDto,
  ): Promise<DataStorageEntity> {
    let data = new DataStorageEntity();
    data.userId = userId;
    data.type = storeData.type;
    data.data = storeData.data;

    data.data = this.cryptr.encrypt(data.data);

    const newData = await this.dataStorageRepository.save(data);

    return newData;
  }

  public async get(
    userId: number,
    params,
  ): Promise<String> {
    const data = await this.dataStorageRepository.find({
      where: {
        userId: userId,
        type: params.type
      },
      order: { created: "DESC" }
    });
    if (!data || data.length === 0) {
      const errors = { Data: ' not found' };
      throw new HttpException({ errors }, 404);
    }

    data[0].data = this.cryptr.decrypt(data[0].data);
    return JSON.stringify(data[0].data);
  }


}

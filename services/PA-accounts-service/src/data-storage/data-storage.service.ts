import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataStorageEntity } from './data-storage.entity';
import { StoreDataDto } from './dto';
import { walletPasswordEncryptionKey } from '../config';
import Cryptr = require('cryptr');

@Injectable()
export class DataStorageService {
  @InjectRepository(DataStorageEntity)
  private readonly dataStorageRepository: Repository<DataStorageEntity>;

  public constructor() {}

  public cryptr = new Cryptr(walletPasswordEncryptionKey);

  public async post(userId: number, storeData: StoreDataDto): Promise<void> {
    let data = new DataStorageEntity();
    data.userId = userId;
    data.type = storeData.type;
    data.data = storeData.data;

    data.data = this.cryptr.encrypt(data.data);

    await this.dataStorageRepository.save(data);
  }

  public async get(userId: number, type: string): Promise<string> {
    const data = await this.dataStorageRepository.find({
      where: {
        userId: userId,
        type: type,
      },
      order: { created: 'DESC' },
    });
    if (!data || data.length === 0) {
      throw new HttpException('', HttpStatus.NOT_FOUND);
    }

    data[0].data = this.cryptr.decrypt(data[0].data);

    return JSON.stringify(data[0].data);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstanceEntity } from './instance.entity';

@Injectable()
export class InstanceService {
  @InjectRepository(InstanceEntity)
  private readonly instanceRepository: Repository<InstanceEntity>;

  public constructor() {}

  public async getInstance(): Promise<InstanceEntity> {
    return await this.instanceRepository.findOne();
  }
}

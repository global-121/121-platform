import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { InstanceEntity } from './instance.entity';

@Injectable()
export class InstanceService {
  @InjectRepository(InstanceEntity)
  private readonly instanceRepository: Repository<InstanceEntity>;

  public async getInstance(): Promise<InstanceEntity> {
    const instances = await this.instanceRepository.find({
      relations: ['monitoringQuestion'],
    });
    return instances[0];
  }

  public async updateInstance(
    updateInstanceDto: UpdateInstanceDto,
  ): Promise<InstanceEntity> {
    const instance = await this.getInstanceOrThrow([]);

    for (const attribute in updateInstanceDto) {
      instance[attribute] = updateInstanceDto[attribute];
    }

    await this.instanceRepository.save(instance);
    return instance;
  }

  private async getInstanceOrThrow(
    relations: string[],
  ): Promise<InstanceEntity> {
    const instance = (await this.instanceRepository.find({ relations }))?.[0];
    if (!instance) {
      const errors = `No instance found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return instance;
  }
}

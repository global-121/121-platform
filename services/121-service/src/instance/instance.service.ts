import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { InstanceEntity } from './instance.entity';

@Injectable()
export class InstanceService {
  @InjectRepository(InstanceEntity)
  private readonly instanceRepository: Repository<InstanceEntity>;

  public constructor() {}

  public async getInstance(): Promise<InstanceEntity> {
    const instance = await this.instanceRepository.findOne({
      relations: ['monitoringQuestion'],
    });
    if (instance.monitoringQuestion) {
      instance['monitoringQuestion'] = instance.monitoringQuestion;
    }
    return instance;
  }

  public async updateInstance(
    updateInstanceDto: UpdateInstanceDto,
  ): Promise<InstanceEntity> {
    const instance = await this.instanceRepository.findOne({
      where: { name: updateInstanceDto.name },
    });
    if (!instance) {
      const errors = `No instance found with name ${updateInstanceDto.name}`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (let attribute in updateInstanceDto) {
      if (attribute !== 'name') {
        instance[attribute] = updateInstanceDto[attribute];
      }
    }

    await this.instanceRepository.save(instance);

    return instance;
  }
}

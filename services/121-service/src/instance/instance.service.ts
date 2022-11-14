import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { UpdateMonitoringQuestionDto } from './dto/update-monitoring-question.dto';
import { InstanceEntity } from './instance.entity';
import { MonitoringQuestionEntity } from './monitoring-question.entity';

@Injectable()
export class InstanceService {
  @InjectRepository(InstanceEntity)
  private readonly instanceRepository: Repository<InstanceEntity>;

  public constructor() {}

  public async getInstance(): Promise<InstanceEntity> {
    const instance = await this.instanceRepository.findOne({
      relations: ['monitoringQuestion'],
    });
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

  public async updateMonitoringQuestion(
    updateMonitoringQuestion: UpdateMonitoringQuestionDto,
  ): Promise<MonitoringQuestionEntity> {
    const instance = await this.instanceRepository.findOne({
      relations: ['monitoringQuestion'],
    });
    if (!instance) {
      const errors = `No instance found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const attribute in updateMonitoringQuestion) {
      if (attribute !== 'id' && attribute !== 'name') {
        instance.monitoringQuestion[attribute] =
          updateMonitoringQuestion[attribute];
      }
    }

    const updatedInstance = await this.instanceRepository.save(instance);

    return updatedInstance.monitoringQuestion;
  }
}

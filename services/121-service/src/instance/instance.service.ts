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

  public async updateMonitoringQuestion(
    updateMonitoringQuestion: UpdateMonitoringQuestionDto,
  ): Promise<MonitoringQuestionEntity> {
    const instance = await this.getInstanceOrThrow(['monitoringQuestion']);

    for (const attribute in updateMonitoringQuestion) {
      instance.monitoringQuestion[attribute] =
        updateMonitoringQuestion[attribute];
    }

    const updatedInstance = await this.instanceRepository.save(instance);
    return updatedInstance.monitoringQuestion;
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

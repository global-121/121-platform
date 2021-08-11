import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../programs/program/program.entity';
import { UserEntity } from '../user/user.entity';
import { RegistrationEntity } from './registration.entity';
import { RegistrationStatusEnum } from './registration-status.enum';

@Injectable()
export class RegistrationsService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor() {}

  public async create(
    postData: CreateRegistrationDto,
    userId: number,
  ): Promise<RegistrationEntity> {
    const user = await this.userRepository.findOne(userId);
    let registration = new RegistrationEntity();
    registration.referenceId = postData.referenceId;
    registration.user = user;
    registration.program = await this.programRepository.findOne(
      postData.programId,
    );
    await this.registrationRepository.save(registration);
    return this.setRegistrationStatus(
      postData.referenceId,
      RegistrationStatusEnum.included,
    );
  }

  public async setRegistrationStatus(
    referenceId: string,
    status: RegistrationStatusEnum,
  ): Promise<RegistrationEntity> {
    const registrationToUpdate = await this.registrationRepository.findOne({
      where: { referenceId: referenceId },
    });
    registrationToUpdate.registrationStatus = status;
    return await this.registrationRepository.save(registrationToUpdate);
  }
}

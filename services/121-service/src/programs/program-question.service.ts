import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegistrationEntity } from '../registration/registration.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ProgramEntity } from './program.entity';

@Injectable()
export class ProgramQuestionService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor() {}
}

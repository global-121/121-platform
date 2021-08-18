import { Injectable } from '@nestjs/common';
import { DeleteResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegistrationEntity } from '../registration.entity';
import { ProgramAnswerEntity } from '../program-answer.entity';

@Injectable()
export class RegistrationAnswersService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(ProgramAnswerEntity)
  private readonly programAnswerRepository: Repository<ProgramAnswerEntity>;

  // AW: delete answers to attributes for a given PA after issuing validationData (identified first through referenceId/QR)
  public async deleteProgramAnswers(
    referenceId: string,
  ): Promise<ProgramAnswerEntity[]> {
    const registration = await this.registrationRepository.findOne({
      where: {
        referenceId: referenceId,
      },
      relations: ['programsAnswers'],
    });
    return await this.programAnswerRepository.remove(
      registration.programAnswers,
    );
  }
}

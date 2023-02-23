import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatchRegistrationDto } from '../registration/dto/patch-registration.dto';
import { RegistrationEntity } from '../registration/registration.entity';

@Injectable()
export class EspocrmService {
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;

  public async patchRegistration(patchRegistrations: PatchRegistrationDto[]): Promise<void> {
    console.log('patchRegistrations: ', patchRegistrations);
    return;
  }

  public async deleteRegistration(): Promise<void> {
    return;
  }
}

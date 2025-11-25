import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

export interface RegistrationAttributeChangeHandler {
  handleAttributeChange(params: {
    readonly registration: RegistrationEntity;
    readonly attribute: string;
    readonly value: string | number | string[] | boolean | null;
  }): Promise<void>;
}

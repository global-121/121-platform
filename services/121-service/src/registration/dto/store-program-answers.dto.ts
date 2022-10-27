import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsRegistrationDataValidType } from '../validator/registration-data-type.validator';

export class ProgramAnswer {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public readonly programQuestionName: string;
  @ApiProperty()
  @IsRegistrationDataValidType({
    referenceId: 'referenceId',
    attribute: 'programQuestionName',
  })
  public programAnswer: string | string[];
}

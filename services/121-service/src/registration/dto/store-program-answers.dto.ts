import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsRegistrationDataValidType } from '../validators/registration-data-type.class.validator';

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

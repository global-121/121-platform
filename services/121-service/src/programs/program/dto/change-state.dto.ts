import { ApiModelProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class ChangeStateDto {
  @ApiModelProperty()
  @IsNotEmpty()
  @IsString()
  @IsIn([
    'design',
    'registrationValidation',
    'inclusion',
    'reviewInclusion',
    'payment',
    'evaluation',
  ])
  public readonly newState: string;
}

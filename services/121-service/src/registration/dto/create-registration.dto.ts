import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';

export class CreateRegistrationDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  @IsString()
  public readonly referenceId: string;

  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
}

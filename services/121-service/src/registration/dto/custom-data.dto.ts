import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsRegistrationDataValidType } from '../validators/registration-data-type.class.validator';

export class CustomDataDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(5, 200)
  public readonly referenceId: string;
  @ApiProperty({ example: 'whatsappPhoneNumber' })
  @IsNotEmpty()
  @IsString()
  public readonly key: string;
  @ApiProperty({ example: '31600000000' })
  @IsNotEmpty()
  @IsRegistrationDataValidType({
    referenceId: 'referenceId',
    attribute: 'key',
  })
  public readonly value: string | string[];
}

import { ApiProperty } from '@nestjs/swagger';

import { Length, IsString, IsNotEmpty } from 'class-validator';

export class CustomDataDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({ example: 'whatsappPhoneNumber' })
  @IsNotEmpty()
  @IsString()
  public readonly key: string;
  @ApiProperty({ example: '31600000000' })
  @IsNotEmpty()
  public readonly value: string | string[];
}
